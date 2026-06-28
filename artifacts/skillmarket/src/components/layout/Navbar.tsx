import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, MessageCircle, Bookmark, Menu, X, ChevronDown, LogOut, Settings, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../common/Avatar";
import { cn } from "../../lib/utils";

function useUnreadCounts(token: string | null, userId: number | undefined) {
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!token || !userId) {
      setUnreadNotifs(0);
      setUnreadMessages(0);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const fetchCounts = async () => {
      try {
        const [nRes, mRes] = await Promise.all([
          fetch("/api/notifications", { headers }),
          fetch("/api/messages/conversations", { headers }),
        ]);
        if (nRes.ok) {
          const notifs = await nRes.json();
          setUnreadNotifs(notifs.filter((n: { isRead: boolean }) => !n.isRead).length);
        }
        if (mRes.ok) {
          const convs = await mRes.json();
          setUnreadMessages(convs.reduce((sum: number, c: { unreadCount: number }) => sum + (c.unreadCount ?? 0), 0));
        }
      } catch {
        // silent
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [token, userId]);

  return { unreadNotifs, unreadMessages };
}

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { unreadNotifs, unreadMessages } = useUnreadCounts(token, user?.id);

  const isActive = (path: string) => location === path;
  const dashboardHref = user?.role === "client" ? "/dashboard/client" : "/dashboard";

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">S</div>
            <span className="text-gray-900">SkillMarket <span className="text-indigo-600">AI</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/projects" className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", isActive("/projects") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50")}>
              Browse Projects
            </Link>
            <Link href="/freelancers" className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", isActive("/freelancers") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50")}>
              Find Talent
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex">
                  <Bell size={20} />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadNotifs > 9 ? "9+" : unreadNotifs}
                    </span>
                  )}
                </Link>
                <Link href="/messages" className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex">
                  <MessageCircle size={20} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>
                <Link href="/saved" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex">
                  <Bookmark size={20} />
                </Link>
                {user.role === "client" && (
                  <Link href="/post-project" className="hidden sm:flex btn-primary text-sm py-2 px-4">
                    Post Project
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                    <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                      <Link href={dashboardHref} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                      <Link href="/profile/edit" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User size={16} /> Edit Profile
                      </Link>
                      <Link href="/notifications" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors sm:hidden" onClick={() => setUserMenuOpen(false)}>
                        <Bell size={16} /> Notifications
                        {unreadNotifs > 0 && <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">{unreadNotifs}</span>}
                      </Link>
                      <Link href="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors sm:hidden" onClick={() => setUserMenuOpen(false)}>
                        <MessageCircle size={16} /> Messages
                        {unreadMessages > 0 && <span className="ml-auto w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">{unreadMessages}</span>}
                      </Link>
                      <Link href="/saved" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors sm:hidden" onClick={() => setUserMenuOpen(false)}>
                        <Bookmark size={16} /> Saved
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:flex btn-ghost text-sm">Sign In</Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <Link href="/projects" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>Browse Projects</Link>
            <Link href="/freelancers" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>Find Talent</Link>
            {!user && (
              <>
                <Link href="/login" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/register" className="block px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
              </>
            )}
            {user?.role === "client" && (
              <Link href="/post-project" className="block px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileOpen(false)}>Post a Project</Link>
            )}
          </div>
        )}
      </div>
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </nav>
  );
}
