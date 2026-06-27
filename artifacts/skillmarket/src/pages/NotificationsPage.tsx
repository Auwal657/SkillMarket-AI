import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
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
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = async () => {
    const res = await fetch(`${BASE}/notifications`, { headers });
    if (res.ok) { const data = await res.json(); setNotifications(data); }
    setLoading(false);
  };

  const markRead = async (id: number) => {
    await fetch(`${BASE}/notifications/${id}/read`, { method: "PATCH", headers });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await fetch(`${BASE}/notifications/read-all`, { method: "PATCH", headers });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const typeIcon: Record<string, string> = {
    application_accepted: "🎉",
    application_rejected: "📋",
    new_application: "📩",
    new_message: "💬",
    review_received: "⭐",
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
              className={cn("p-4 rounded-2xl border transition-colors cursor-pointer", n.isRead ? "border-gray-100 bg-white" : "border-indigo-100 bg-indigo-50 hover:bg-indigo-100/50")}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{typeIcon[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
