import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearch } from "wouter";
import { MessageCircle, Send, Paperclip, X, FileText, Image, Search, Circle, MoreVertical, Menu } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

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
      const ids = conversations.map(c => c.otherUser?.id).filter(Boolean) as number[];
      if (ids.length > 0) socket.emit("presence:query", ids);
    };
    const onDisconnect = () => setSocketConnected(false);

    const onNewMessage = (msg: Message) => {
      if (msg.conversationId === activeConvRef.current) {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        socket.emit("conversation:read", msg.conversationId);
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

  // Join/leave room
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConv) return;
    socket.emit("join:conversation", activeConv);
    socket.emit("conversation:read", activeConv);
    setMobileSidebarOpen(false); // hide sidebar on mobile when opening chat
    return () => { socket.emit("leave:conversation", activeConv); };
  }, [activeConv]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (activeConv) { fetchMessages(activeConv); }
  }, [activeConv, fetchMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Polling fallback
  useEffect(() => {
    if (socketConnected) return;
    const convInterval = setInterval(() => fetchConversations(), 10000);
    const msgInterval = setInterval(() => {
      if (activeConvRef.current) fetchMessages(activeConvRef.current);
    }, 3000);
    return () => { clearInterval(convInterval); clearInterval(msgInterval); };
  }, [socketConnected, fetchConversations, fetchMessages]);

  // Recipient query param handler
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
        setMobileSidebarOpen(false);
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

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;

  const filteredConversations = conversations.filter(c => 
    c.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConvData = conversations.find(c => c.id === activeConv);
  const isNewRecipient = recipientId && !activeConv && !conversations.find(c => c.otherUser?.id === parseInt(recipientId));
  const activeOtherUser = activeConvData?.otherUser ?? recipientInfo;
  const isOtherUserTyping = activeOtherUser && typingUsers.has(activeOtherUser.id);
  const canSend = !sending && (newMsg.trim().length > 0 || !!attachment);

  const renderAttachment = (msg: Message, isMe: boolean) => {
    if (!msg.attachmentUrl) return null;
    const isImage = msg.attachmentType?.startsWith("image/");
    
    if (isImage) {
      return (
        <div className="mt-2 rounded-xl overflow-hidden shadow-sm border border-black/5 bg-black/5">
          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
            <img src={msg.attachmentUrl} alt="attachment" className="max-w-xs max-h-48 object-cover hover:opacity-90 transition-opacity" />
          </a>
        </div>
      );
    }

    return (
      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer"
        className={cn("flex items-center gap-2 mt-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 shadow-sm")}>
        <FileText size={16} />
        <span className="truncate max-w-[200px]">{msg.attachmentName ?? "Document"}</span>
      </a>
    );
  };

  const inputForm = (onSubmit: (e: React.FormEvent) => Promise<void>, placeholder: string) => (
    <form onSubmit={onSubmit} className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
      {attachment && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl max-w-sm">
          <FileText size={18} className="text-indigo-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-900 truncate">{attachment.name}</p>
            <p className="text-xs text-indigo-500 uppercase">{attachment.type.split('/')[1] || 'FILE'}</p>
          </div>
          <button type="button" onClick={() => setAttachment(null)} className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
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
          className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
          title="Attach file"
        >
          {uploading ? <span className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin block" /> : <Paperclip size={20} />}
        </button>
        
        <textarea
          value={newMsg}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSubmit(e as unknown as React.FormEvent);
            }
          }}
          className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-3 px-2 max-h-32 min-h-[44px] text-gray-900 placeholder:text-gray-400"
          placeholder={placeholder}
          rows={1}
        />
        
        <button 
          type="submit" 
          disabled={!canSend} 
          className={cn("p-3 rounded-xl flex-shrink-0 transition-all shadow-sm", 
            canSend ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow" : "bg-gray-200 text-gray-400")}
        >
          <Send size={20} className={cn(canSend && "translate-x-0.5 -translate-y-0.5 transition-transform")} />
        </button>
      </div>
    </form>
  );

  return (
    <div className="h-[calc(100vh-64px)] max-w-[1600px] mx-auto flex flex-col pt-4 pb-6 px-4 sm:px-6 animate-fade-in">
      
      <div className="card flex-1 flex overflow-hidden shadow-xl border-gray-200">
        
        {/* Sidebar */}
        <div className={cn(
          "flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 bg-white flex-shrink-0 transition-transform duration-300",
          !mobileSidebarOpen && activeConv ? "hidden md:flex" : "flex"
        )}>
          {/* Sidebar Header */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">{conversations.length}</span>
            </div>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 scrollbar-hide">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle size={24} className="text-gray-300" />
                </div>
                <p className="text-gray-900 font-medium text-sm">No conversations</p>
                <p className="text-xs text-gray-500 mt-1">{searchQuery ? "No matches found" : "Start chatting with freelancers"}</p>
              </div>
            ) : filteredConversations.map(conv => {
              const isOnline = conv.otherUser ? onlineUsers.has(conv.otherUser.id) : false;
              const isActive = activeConv === conv.id;
              const hasUnread = conv.unreadCount > 0;
              
              return (
                <button 
                  key={conv.id} 
                  onClick={() => setActiveConv(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                    isActive ? "bg-indigo-600 shadow-md shadow-indigo-200" : "hover:bg-gray-50 bg-transparent"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar name={conv.otherUser?.name ?? "?"} avatarUrl={conv.otherUser?.avatarUrl} size="md" />
                    <span className={cn(
                      "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2",
                      isActive ? "border-indigo-600" : "border-white",
                      isOnline ? "bg-green-500" : "bg-gray-300"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn("font-semibold text-sm truncate", isActive ? "text-white" : "text-gray-900")}>
                        {conv.otherUser?.name}
                      </p>
                      {conv.lastMessage && (
                        <p className={cn("text-[10px] flex-shrink-0", isActive ? "text-indigo-200" : (hasUnread ? "text-indigo-600 font-bold" : "text-gray-400"))}>
                          {formatRelativeTime(conv.lastMessage.createdAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-xs truncate flex-1", 
                        isActive ? "text-indigo-100" : (hasUnread ? "text-gray-900 font-medium" : "text-gray-500")
                      )}>
                        {conv.lastMessage?.attachmentName && !conv.lastMessage.content ? "📎 Attachment" : conv.lastMessage?.content ?? "No messages yet"}
                      </p>
                      {hasUnread && !isActive && (
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-gray-50/30",
          mobileSidebarOpen && !activeConv && !isNewRecipient ? "hidden md:flex" : "flex"
        )}>
          {(activeConv || isNewRecipient) ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <Menu size={20} />
                  </button>
                  
                  {activeOtherUser ? (
                    <div className="flex items-center gap-3">
                      <Avatar name={activeOtherUser.name} avatarUrl={activeOtherUser.avatarUrl} size="md" />
                      <div>
                        <p className="font-bold text-gray-900 text-base">{activeOtherUser.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {onlineUsers.has(activeOtherUser.id) ? (
                            <>
                              <Circle size={8} className="fill-green-500 text-green-500" />
                              <span className="text-xs font-medium text-green-600">Online now</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500 capitalize">{activeOtherUser.role}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-gray-900 text-base">New Conversation</p>
                      <p className="text-xs text-gray-500">Connecting...</p>
                    </div>
                  )}
                </div>
                
                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!activeConv && isNewRecipient && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Avatar name={activeOtherUser?.name ?? "?"} avatarUrl={activeOtherUser?.avatarUrl} size="xl" />
                    <h3 className="mt-4 text-xl font-bold text-gray-900">{activeOtherUser?.name}</h3>
                    <p className="text-gray-500 text-sm mt-2 max-w-sm">This is the beginning of your conversation. Send a message to start collaborating.</p>
                  </div>
                )}

                {/* Date separator (mocked logic for visual) */}
                {messages.length > 0 && (
                  <div className="flex justify-center pt-2 pb-4">
                    <span className="bg-white border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      Conversation Started
                    </span>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  const showAvatar = !isMe && (i === messages.length - 1 || messages[i + 1]?.senderId !== msg.senderId);
                  
                  return (
                    <div key={msg.id} className={cn("flex gap-3", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && (
                        <div className="w-8 flex-shrink-0 flex items-end pb-1">
                          {showAvatar && <Avatar name={activeOtherUser?.name ?? "?"} avatarUrl={activeOtherUser?.avatarUrl} size="sm" />}
                        </div>
                      )}
                      
                      <div className={cn("flex flex-col max-w-[75%] md:max-w-[65%]", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-5 py-3 text-[15px] shadow-sm",
                          isMe 
                            ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm" 
                            : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm"
                        )}>
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                          {renderAttachment(msg, isMe)}
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-1.5 px-1">
                          <span className="text-[11px] font-medium text-gray-400">
                            {formatRelativeTime(msg.createdAt)}
                          </span>
                          {isMe && (
                            <span className={cn("text-[10px] font-bold", msg.isRead ? "text-indigo-500" : "text-gray-300")}>
                              {msg.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isOtherUserTyping && (
                  <div className="flex justify-start gap-3">
                    <div className="w-8 flex-shrink-0 flex items-end pb-1">
                      <Avatar name={activeOtherUser?.name ?? "?"} avatarUrl={activeOtherUser?.avatarUrl} size="sm" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm flex items-center gap-1.5 h-10">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {activeConv
                ? inputForm(handleSend, "Message...")
                : inputForm(handleSendToNewRecipient, "Say hello...")}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 hidden md:flex">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-gray-100">
                <MessageCircle size={40} className="text-indigo-200" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">SkillMarket Messages</h2>
              <p className="text-gray-500 max-w-sm">Select a conversation from the sidebar to view messages, or start a new chat from a freelancer's profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
