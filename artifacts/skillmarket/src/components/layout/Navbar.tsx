import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, MessageCircle, Bookmark, Menu, X, ChevronDown, LogOut, LayoutDashboard, User, Wallet } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../common/Avatar";
import { cn } from "../../lib/utils";

// S2: Poll using credentials: "include" (httpOnly cookie) instead of Authorization header
function useUnreadCounts(userId: number | undefined) {
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!userId) {
      setUnreadNotifs(0);
      setUnreadMessages(0);
      return;
    }

    const fetchCounts = async () => {
      try {
        const [nRes, mRes] = await Promise.all([
          fetch("/api/notifications", { credentials: "include" }),
          fetch("/api/messages/conversations", { credentials: "include" }),
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
  }, [userId]);

  return { unreadNotifs, unreadMessages };
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { unreadNotifs, unreadMessages } = useUnreadCounts(user?.id);

  const isActive = (path: string) => location === path;
  const dashboardHref = user?.role === "client" ? "/dashboard/client" : "/dashboard";

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav className={cn(
        "sticky top-0 z-50 bg-white/90 backdrop-blur-lg transition-all duration-200",
        scrolled ? "border-b border-gray-200 shadow-sm" : "border-b border-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:bg-indigo-700 transition-colors">S</div>
              <span className="text-gray-900 tracking-tight">SkillMarket <span className="text-indigo-600">AI</span></span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
              <Link href="/projects" className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", isActive("/projects") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100")}>
                Browse Projects
              </Link>
              <Link href="/freelancers" className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", isActive("/freelancers") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100")}>
                Find Talent
              </Link>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2.5">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-1.5 mr-2">
                    <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Bell size={20} />
                      {unreadNotifs > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                      )}
                    </Link>
                    <Link href="/messages" className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <MessageCircle size={20} />
                      {unreadMessages > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border border-white" />
                      )}
                    </Link>
                    <Link href="/saved" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Bookmark size={20} />
                    </Link>
                  </div>
                  
                  {user.role === "client" && (
                    <Link href="/post-project" className="hidden lg:flex btn-primary btn-sm text-sm">
                      Post Project
                    </Link>
                  )}
                  
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                      <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
                    </button>
                    
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 py-1 z-50 animate-in">
                        <div className="px-4 py-3 border-b border-gray-100 mb-1">
                          <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                        <div className="p-1">
                          <Link href={dashboardHref} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <LayoutDashboard size={16} /> Dashboard
                          </Link>
                          <Link href="/profile/edit" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <User size={16} /> Edit Profile
                          </Link>
                          <Link href="/wallet" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <Wallet size={16} /> Wallet
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 p-1 mt-1">
                          <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left">
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
                  <Link href="/register" className="btn-primary text-sm py-2 px-4 hidden sm:flex">Get Started</Link>
                </>
              )}
              
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg ml-1">
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-40 md:hidden bg-white">
            <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
              <div className="space-y-1 mb-8">
                <Link href="/projects" className="block px-4 py-3 text-base font-medium text-gray-900 bg-gray-50 rounded-xl" onClick={() => setMobileOpen(false)}>Browse Projects</Link>
                <Link href="/freelancers" className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-xl" onClick={() => setMobileOpen(false)}>Find Talent</Link>
              </div>
              
              {!user ? (
                <div className="mt-auto pb-8 space-y-3">
                  <Link href="/login" className="btn-secondary w-full justify-center py-3" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  <Link href="/register" className="btn-primary w-full justify-center py-3" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-4 py-2 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">My Account</div>
                  {user.role === "client" && (
                    <Link href="/post-project" className="block px-4 py-3 text-base font-medium text-indigo-600 bg-indigo-50 rounded-xl mb-4" onClick={() => setMobileOpen(false)}>Post a Project</Link>
                  )}
                  <Link href={dashboardHref} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard size={18} className="text-gray-500" /> Dashboard
                  </Link>
                  <Link href="/notifications" className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                    <Bell size={18} className="text-gray-500" /> Notifications
                    {unreadNotifs > 0 && <span className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">{unreadNotifs}</span>}
                  </Link>
                  <Link href="/messages" className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                    <MessageCircle size={18} className="text-gray-500" /> Messages
                    {unreadMessages > 0 && <span className="ml-auto bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">{unreadMessages}</span>}
                  </Link>
                  <Link href="/saved" className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                    <Bookmark size={18} className="text-gray-500" /> Saved
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl w-full text-left mt-4">
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </>
  );
}
