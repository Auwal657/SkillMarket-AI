import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bell, CheckCheck, Gift, FileText, CheckCircle2, XCircle, MessageSquare, Star, Trophy, Circle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatRelativeTime, cn } from "../lib/utils";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const BASE = "/api";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const res = await fetch(`${BASE}/notifications`, { credentials: "include" });
    if (res.ok) { const data = await res.json(); setNotifications(data); }
    setLoading(false);
  };

  const markRead = async (id: number) => {
    await fetch(`${BASE}/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await fetch(`${BASE}/notifications/read-all`, { method: "PATCH", credentials: "include" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  useEffect(() => {
    if (user) fetchNotifications();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'application_accepted': return { icon: CheckCircle2, bg: "bg-green-100", text: "text-green-600" };
      case 'application_rejected': return { icon: XCircle, bg: "bg-red-100", text: "text-red-600" };
      case 'new_application': return { icon: FileText, bg: "bg-blue-100", text: "text-blue-600" };
      case 'new_message': return { icon: MessageSquare, bg: "bg-purple-100", text: "text-purple-600" };
      case 'review_received': return { icon: Star, bg: "bg-yellow-100", text: "text-yellow-600" };
      case 'project_completed': return { icon: Trophy, bg: "bg-orange-100", text: "text-orange-600" };
      default: return { icon: Bell, bg: "bg-gray-100", text: "text-gray-600" };
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-2 text-sm">Stay updated on your projects, messages, and account activity.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200"
          >
            <CheckCheck size={16} className="text-indigo-600" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
          <p className="text-gray-500 max-w-sm mx-auto">When you receive new messages, project updates, or account alerts, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const style = getTypeStyle(n.type);
            const Icon = style.icon;
            
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  "group relative p-5 rounded-2xl border transition-all duration-200",
                  n.isRead 
                    ? "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm" 
                    : "border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 shadow-sm",
                  n.link ? "cursor-pointer" : "cursor-default"
                )}
              >
                {!n.isRead && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-12 bg-indigo-600 rounded-r-full" />
                )}
                
                <div className="flex gap-4">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", style.bg)}>
                    <Icon size={20} className={style.text} />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={cn("font-semibold text-base", n.isRead ? "text-gray-900" : "text-gray-900")}>
                        {n.title}
                      </p>
                      <span className={cn("text-[11px] font-medium whitespace-nowrap flex-shrink-0", n.isRead ? "text-gray-400" : "text-indigo-600")}>
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    
                    <p className={cn("text-sm leading-relaxed", n.isRead ? "text-gray-600" : "text-gray-800 font-medium")}>
                      {n.message}
                    </p>
                    
                    {n.link && (
                      <p className={cn(
                        "text-xs font-semibold mt-3 flex items-center gap-1 transition-colors",
                        n.isRead ? "text-gray-400 group-hover:text-indigo-600" : "text-indigo-600"
                      )}>
                        View Details <span className="transform transition-transform group-hover:translate-x-1">→</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
