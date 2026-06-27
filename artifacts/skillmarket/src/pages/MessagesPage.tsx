import { useState, useEffect, useRef } from "react";
import { useParams, useSearch } from "wouter";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/common/Avatar";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { formatRelativeTime } from "../lib/utils";

interface Conversation {
  id: number;
  otherUser: { id: number; name: string; avatarUrl?: string | null; role: string } | null;
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
}

const BASE = "/api";

export default function MessagesPage() {
  const { id: convIdParam } = useParams<{ id?: string }>();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const recipientId = params.get("recipient");

  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<number | null>(convIdParam ? parseInt(convIdParam) : null);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const fetchConversations = async () => {
    const res = await fetch(`${BASE}/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setConversations(data); }
    setLoading(false);
  };

  const fetchMessages = async (convId: number) => {
    const res = await fetch(`${BASE}/messages/${convId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setMessages(data); }
  };

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (activeConv) { fetchMessages(activeConv); } }, [activeConv]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (recipientId && token) {
      const start = async () => {
        const res = await fetch(`${BASE}/messages`, { method: "POST", headers, body: JSON.stringify({ recipientId: parseInt(recipientId), content: "Hi! I'd like to get in touch." }) });
        if (res.ok) {
          const msg = await res.json();
          await fetchConversations();
          setActiveConv(msg.conversationId);
        }
      };
      start();
    }
  }, [recipientId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;
    setSending(true);
    try {
      const conv = conversations.find(c => c.id === activeConv);
      const otherId = conv?.otherUser?.id;
      if (!otherId) return;
      await fetch(`${BASE}/messages`, { method: "POST", headers, body: JSON.stringify({ recipientId: otherId, content: newMsg.trim() }) });
      setNewMsg("");
      await fetchMessages(activeConv);
      await fetchConversations();
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

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
            ) : conversations.map(conv => (
              <button key={conv.id} onClick={() => setActiveConv(conv.id)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${activeConv === conv.id ? "bg-indigo-50" : ""}`}>
                <Avatar name={conv.otherUser?.name ?? "?"} avatarUrl={conv.otherUser?.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{conv.otherUser?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{conv.lastMessage?.content ?? "No messages"}</p>
                </div>
                {conv.unreadCount > 0 && <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        {activeConv ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              {(() => {
                const conv = conversations.find(c => c.id === activeConv);
                return conv?.otherUser ? (
                  <>
                    <Avatar name={conv.otherUser.name} avatarUrl={conv.otherUser.avatarUrl} size="sm" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{conv.otherUser.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{conv.otherUser.role}</p>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-indigo-200" : "text-gray-400"}`}>{formatRelativeTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-3">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} className="input flex-1 py-2.5" placeholder="Type a message..." />
              <button type="submit" disabled={sending || !newMsg.trim()} className="btn-primary px-4 py-2.5 disabled:opacity-50">
                <Send size={18} />
              </button>
            </form>
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
