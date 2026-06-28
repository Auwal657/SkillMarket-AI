import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearch } from "wouter";
import { MessageCircle, Send, Paperclip, X, FileText, Image } from "lucide-react";
import { io as socketIO, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/common/Avatar";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { formatRelativeTime, cn } from "../lib/utils";

interface Conversation {
  id: number;
  otherUser: { id: number; name: string; avatarUrl?: string | null; role: string } | null;
  lastMessage: { content: string; createdAt: string; attachmentName?: string | null } | null;
  unreadCount: number;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  conversationId?: number;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
}

const BASE = "/api";

let _socket: Socket | null = null;
function getSocket(): Socket {
  if (!_socket) {
    _socket = socketIO("/", {
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return _socket;
}

export default function MessagesPage() {
  const { id: convIdParam } = useParams<{ id?: string }>();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const recipientId = params.get("recipient");

  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<number | null>(convIdParam ? parseInt(convIdParam) : null);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{ id: number; name: string; avatarUrl?: string | null; role: string } | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recipientOpened = useRef<string | null>(null);
  const activeConvRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  activeConvRef.current = activeConv;

  const fetchConversations = useCallback(async () => {
    const res = await fetch(`${BASE}/messages/conversations`, { credentials: "include" });
    if (res.ok) { const data = await res.json(); setConversations(data); }
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async (convId: number) => {
    const res = await fetch(`${BASE}/messages/${convId}`, { credentials: "include" });
    if (res.ok) { const data = await res.json(); setMessages(data); }
  }, []);

  // Socket.IO setup
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setSocketConnected(true);
      // Query presence for all known conversation partners
      const ids = conversations.map(c => c.otherUser?.id).filter(Boolean) as number[];
      if (ids.length > 0) socket.emit("presence:query", ids);
    };
    const onDisconnect = () => setSocketConnected(false);

    const onNewMessage = (msg: Message) => {
      if (msg.conversationId === activeConvRef.current) {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        socket.emit("conversation:read", msg.conversationId);
        // Clear typing when message arrives
        setTypingUsers(prev => { const next = new Set(prev); next.delete(msg.senderId); return next; });
      }
      fetchConversations();
    };

    const onConversationUpdated = () => { fetchConversations(); };

    const onTypingStart = ({ userId }: { userId: number; conversationId: number }) => {
      setTypingUsers(prev => new Set([...prev, userId]));
    };
    const onTypingStop = ({ userId }: { userId: number }) => {
      setTypingUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    };
    const onPresenceOnline = ({ userId }: { userId: number }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    };
    const onPresenceOffline = ({ userId }: { userId: number }) => {
      setOnlineUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    };
    const onPresenceStatus = (status: Record<number, boolean>) => {
      setOnlineUsers(new Set(Object.entries(status).filter(([, v]) => v).map(([k]) => Number(k))));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message:new", onNewMessage);
    socket.on("conversation:updated", onConversationUpdated);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("presence:online", onPresenceOnline);
    socket.on("presence:offline", onPresenceOffline);
    socket.on("presence:status", onPresenceStatus);
    if (socket.connected) setSocketConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:new", onNewMessage);
      socket.off("conversation:updated", onConversationUpdated);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("presence:online", onPresenceOnline);
      socket.off("presence:offline", onPresenceOffline);
      socket.off("presence:status", onPresenceStatus);
    };
  }, [user, fetchConversations, conversations]);

  // Join/leave conversation socket room
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConv) return;
    socket.emit("join:conversation", activeConv);
    socket.emit("conversation:read", activeConv);
    return () => { socket.emit("leave:conversation", activeConv); };
  }, [activeConv]);

  // Initial load
  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConv) { fetchMessages(activeConv); }
  }, [activeConv, fetchMessages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Fallback polling when socket is not connected
  useEffect(() => {
    if (socketConnected) return;
    const convInterval = setInterval(() => fetchConversations(), 10000);
    const msgInterval = setInterval(() => {
      if (activeConvRef.current) fetchMessages(activeConvRef.current);
    }, 3000);
    return () => { clearInterval(convInterval); clearInterval(msgInterval); };
  }, [socketConnected, fetchConversations, fetchMessages]);

  // When arriving via ?recipient=X
  useEffect(() => {
    if (!recipientId || !user) return;
    if (recipientOpened.current === recipientId) return;
    recipientOpened.current = recipientId;

    const openConversation = async () => {
      const [convsRes, userRes] = await Promise.all([
        fetch(`${BASE}/messages/conversations`, { credentials: "include" }),
        fetch(`/api/users/${recipientId}`, { credentials: "include" }),
      ]);
      if (convsRes.ok) {
        const convs: Conversation[] = await convsRes.json();
        setConversations(convs);
        const existing = convs.find(c => c.otherUser?.id === parseInt(recipientId));
        if (existing) { setActiveConv(existing.id); return; }
      }
      if (userRes.ok) {
        const u = await userRes.json();
        setRecipientInfo({ id: u.id, name: u.name, avatarUrl: u.avatarUrl ?? null, role: u.role });
      }
    };
    openConversation();
  }, [recipientId, user]);

  const handleTyping = (value: string) => {
    setNewMsg(value);
    const socket = socketRef.current;
    if (!socket?.connected || !activeConv) return;
    socket.emit("typing:start", { conversationId: activeConv });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: activeConv });
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", credentials: "include", body: formData });
      if (res.ok) {
        const data = await res.json();
        setAttachment({ url: data.url, name: data.name, type: data.type });
      } else {
        const data = await res.json();
        alert(data.error ?? "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const emitMessage = (socket: Socket, recipientId: number, content: string) => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socket.emit("message:send", {
      recipientId,
      content,
      ...(attachment ? { attachmentUrl: attachment.url, attachmentName: attachment.name, attachmentType: attachment.type } : {}),
    });
    setNewMsg("");
    setAttachment(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() && !attachment) return;
    if (!activeConv) return;
    const content = newMsg.trim();
    setSending(true);
    try {
      const conv = conversations.find(c => c.id === activeConv);
      const otherId = conv?.otherUser?.id;
      if (!otherId) return;

      const socket = socketRef.current;
      if (socket?.connected) {
        emitMessage(socket, otherId, content);
      } else {
        await fetch(`${BASE}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ recipientId: otherId, content }),
        });
        setNewMsg("");
        setAttachment(null);
        await fetchMessages(activeConv);
        await fetchConversations();
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendToNewRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() && !attachment) return;
    if (!recipientId) return;
    const content = newMsg.trim();
    setSending(true);
    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        emitMessage(socket, parseInt(recipientId), content);
        setTimeout(async () => {
          await fetchConversations();
          const convs: Conversation[] = await fetch(`${BASE}/messages/conversations`, { credentials: "include" }).then(r => r.json()).catch(() => []);
          const created = convs.find((c: Conversation) => c.otherUser?.id === parseInt(recipientId));
          if (created) setActiveConv(created.id);
        }, 600);
      } else {
        const res = await fetch(`${BASE}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ recipientId: parseInt(recipientId), content }),
        });
        if (res.ok) {
          const msg = await res.json();
          setNewMsg("");
          setAttachment(null);
          await fetchConversations();
          setActiveConv(msg.conversationId);
        }
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const activeConvData = conversations.find(c => c.id === activeConv);
  const isNewRecipient = recipientId && !activeConv && !conversations.find(c => c.otherUser?.id === parseInt(recipientId));
  const activeOtherUser = activeConvData?.otherUser ?? recipientInfo;
  const isOtherUserTyping = activeOtherUser && typingUsers.has(activeOtherUser.id);
  const canSend = !sending && (newMsg.trim().length > 0 || !!attachment);

  const renderAttachment = (msg: Message, isMe: boolean) => {
    if (!msg.attachmentUrl) return null;
    const isImage = msg.attachmentType?.startsWith("image/");
    return (
      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer"
        className={cn("flex items-center gap-2 mt-2 p-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80",
          isMe ? "bg-indigo-500 text-white" : "bg-white text-gray-700 border border-gray-200")}>
        {isImage ? <Image size={14} /> : <FileText size={14} />}
        <span className="truncate max-w-[180px]">{msg.attachmentName ?? "Attachment"}</span>
      </a>
    );
  };

  const inputForm = (onSubmit: (e: React.FormEvent) => Promise<void>, placeholder: string) => (
    <form onSubmit={onSubmit} className="p-4 border-t border-gray-100 space-y-2">
      {attachment && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
          <FileText size={14} className="text-indigo-600 flex-shrink-0" />
          <span className="text-indigo-700 truncate flex-1">{attachment.name}</span>
          <button type="button" onClick={() => setAttachment(null)} className="text-indigo-400 hover:text-indigo-600">
            <X size={14} />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50"
          title="Attach file"
        >
          {uploading ? <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin block" /> : <Paperclip size={18} />}
        </button>
        <input
          value={newMsg}
          onChange={e => handleTyping(e.target.value)}
          className="input flex-1 py-2.5"
          placeholder={placeholder}
        />
        <button type="submit" disabled={!canSend} className="btn-primary px-4 py-2.5 disabled:opacity-50">
          <Send size={18} />
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      <div className="card overflow-hidden flex" style={{ height: "70vh" }}>
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <p className="font-medium text-gray-700 text-sm">Conversations</p>
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No conversations yet</div>
            ) : conversations.map(conv => {
              const isOnline = conv.otherUser ? onlineUsers.has(conv.otherUser.id) : false;
              return (
                <button key={conv.id} onClick={() => setActiveConv(conv.id)}
                  className={cn("w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50", activeConv === conv.id && "bg-indigo-50")}>
                  <div className="relative flex-shrink-0">
                    <Avatar name={conv.otherUser?.name ?? "?"} avatarUrl={conv.otherUser?.avatarUrl} size="sm" />
                    <span className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white", isOnline ? "bg-green-500" : "bg-gray-300")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{conv.otherUser?.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage?.attachmentName && !conv.lastMessage.content ? `📎 ${conv.lastMessage.attachmentName}` : conv.lastMessage?.content ?? "No messages"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat */}
        {(activeConv || isNewRecipient) ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              {activeOtherUser ? (
                <>
                  <div className="relative">
                    <Avatar name={activeOtherUser.name} avatarUrl={activeOtherUser.avatarUrl} size="sm" />
                    <span className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
                      onlineUsers.has(activeOtherUser.id) ? "bg-green-500" : "bg-gray-300")} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{activeOtherUser.name}</p>
                    <p className="text-xs text-gray-400">
                      {onlineUsers.has(activeOtherUser.id) ? "Online" : activeOtherUser.role}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-gray-700">New conversation</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!activeConv && isNewRecipient && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-400 text-sm">Send a message to start the conversation</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm",
                      isMe ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm")}>
                      {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                      {renderAttachment(msg, isMe)}
                      <p className={cn("text-xs mt-1", isMe ? "text-indigo-200" : "text-gray-400")}>
                        {formatRelativeTime(msg.createdAt)}
                        {isMe && msg.isRead && <span className="ml-1">✓✓</span>}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isOtherUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {activeConv
              ? inputForm(handleSend, "Type a message...")
              : inputForm(handleSendToNewRecipient, "Type your first message...")}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={MessageCircle} title="Select a conversation" description="Choose a conversation from the left or message a freelancer from their profile." />
          </div>
        )}
      </div>
    </div>
  );
}
