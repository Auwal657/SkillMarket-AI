import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Bell, MessageCircle, Bookmark, Menu, X, ChevronDown, LogOut, LayoutDashboard, User, Wallet, Plus, FileText, Zap } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../common/Avatar";
import { cn } from "../../lib/utils";

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
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  const { unreadNotifs, unreadMessages } = useUnreadCounts(user?.id);

  const isActive = (path: string) => location === path || location.startsWith(path + "/");
  const dashboardHref = user?.role === "client" ? "/dashboard/client" : "/dashboard";

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className={cn(
        "sticky top-0 z-50 bg-white/95 backdrop-blur-lg transition-all duration-200",
        scrolled ? "border-b border-gray-200 shadow-sm" : "border-b border-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:bg-indigo-700 transition-colors">S</div>
              <span className="text-gray-900 tracking-tight hidden xs:inline sm:inline">SkillMarket <span className="text-indigo-600">AI</span></span>
            </Link>

            {/* Desktop Nav - centered */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              <Link href="/projects" className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/projects") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}>
                Browse Projects
              </Link>
              <Link href="/freelancers" className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/freelancers") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}>
                Find Talent
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {user ? (
                <>
                  {/* Desktop icon buttons */}
                  <div className="hidden sm:flex items-center gap-0.5">
                    <Link href="/notifications" className="relative p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Bell size={20} />
                      {unreadNotifs > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                      )}
                    </Link>
                    <Link href="/messages" className="relative p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <MessageCircle size={20} />
                      {unreadMessages > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border border-white" />
                      )}
                    </Link>
                    <Link href="/saved" className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Bookmark size={20} />
                    </Link>
                  </div>

                  {user.role === "client" && (
                    <Link href="/post-project" className="hidden lg:flex btn-primary text-sm py-2 px-4">
                      <Plus size={15} /> Post Project
                    </Link>
                  )}

                  {/* User dropdown */}
                  <div className="relative hidden md:block" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(v => !v)}
                      className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                      <ChevronDown size={14} className={cn("text-gray-500 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg shadow-gray-200/80 border border-gray-100 py-1 z-50 animate-scale-in">
                        <div className="px-4 py-3 border-b border-gray-100 mb-1">
                          <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role}</p>
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
                          <Link href="/notifications" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <Bell size={16} /> Notifications
                            {unreadNotifs > 0 && <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadNotifs}</span>}
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

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="md:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-target flex items-center justify-center"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Portal — rendered outside nav to avoid z-index stacking issues */}
      {mobileOpen && (
        <>
          {/* Dark overlay */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden animate-overlay-in"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Slide-in drawer from left */}
          <div
            className="fixed top-0 left-0 bottom-0 z-[70] w-[min(320px,90vw)] bg-white shadow-2xl md:hidden flex flex-col animate-drawer-in"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <Link href="/" onClick={closeMobile} className="flex items-center gap-2.5 font-bold text-lg">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">S</div>
                <span className="text-gray-900">SkillMarket <span className="text-indigo-600">AI</span></span>
              </Link>
              <button
                onClick={closeMobile}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors touch-target flex items-center justify-center"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User info (if logged in) */}
            {user && (
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-indigo-50/30">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {/* Public links */}
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 pb-1 pt-1">Explore</p>
              <Link href="/projects" onClick={closeMobile} className={cn(
                "mobile-nav-item",
                isActive("/projects") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              )}>
                <FileText size={18} className="flex-shrink-0" />
                Browse Projects
              </Link>
              <Link href="/freelancers" onClick={closeMobile} className={cn(
                "mobile-nav-item",
                isActive("/freelancers") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              )}>
                <User size={18} className="flex-shrink-0" />
                Find Talent
              </Link>

              {user ? (
                <>
                  <div className="pt-3 pb-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 pb-1">My Account</p>
                  </div>

                  <Link href={dashboardHref} onClick={closeMobile} className={cn(
                    "mobile-nav-item",
                    isActive(dashboardHref) ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <LayoutDashboard size={18} className="flex-shrink-0" />
                    Dashboard
                  </Link>

                  <Link href="/messages" onClick={closeMobile} className={cn(
                    "mobile-nav-item",
                    isActive("/messages") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <MessageCircle size={18} className="flex-shrink-0" />
                    Messages
                    {unreadMessages > 0 && (
                      <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{unreadMessages}</span>
                    )}
                  </Link>

                  <Link href="/notifications" onClick={closeMobile} className={cn(
                    "mobile-nav-item",
                    isActive("/notifications") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Bell size={18} className="flex-shrink-0" />
                    Notifications
                    {unreadNotifs > 0 && (
                      <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{unreadNotifs}</span>
                    )}
                  </Link>

                  <Link href="/saved" onClick={closeMobile} className={cn(
                    "mobile-nav-item",
                    isActive("/saved") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Bookmark size={18} className="flex-shrink-0" />
                    Saved
                  </Link>

                  <Link href="/wallet" onClick={closeMobile} className={cn(
                    "mobile-nav-item",
                    isActive("/wallet") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Wallet size={18} className="flex-shrink-0" />
                    Wallet
                  </Link>

                  <Link href="/profile/edit" onClick={closeMobile} className={cn(
                    "mobile-nav-item",
                    isActive("/profile") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <User size={18} className="flex-shrink-0" />
                    Edit Profile
                  </Link>

                  {user.role === "freelancer" && (
                    <>
                      <Link href="/profile/skills" onClick={closeMobile} className="mobile-nav-item text-gray-700 hover:bg-gray-100">
                        <Zap size={18} className="flex-shrink-0" />
                        Manage Skills
                      </Link>
                      <Link href="/applications" onClick={closeMobile} className="mobile-nav-item text-gray-700 hover:bg-gray-100">
                        <FileText size={18} className="flex-shrink-0" />
                        My Applications
                      </Link>
                    </>
                  )}

                  {user.role === "client" && (
                    <>
                      <Link href="/my-projects" onClick={closeMobile} className="mobile-nav-item text-gray-700 hover:bg-gray-100">
                        <FileText size={18} className="flex-shrink-0" />
                        My Projects
                      </Link>
                    </>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-gray-100 space-y-2 bg-gray-50/50">
              {user ? (
                <>
                  {user.role === "client" && (
                    <Link href="/post-project" onClick={closeMobile} className="btn-primary w-full py-3 text-base">
                      <Plus size={18} /> Post a Project
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); closeMobile(); }}
                    className="flex items-center justify-center gap-2.5 w-full py-3 px-4 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" onClick={closeMobile} className="btn-primary w-full py-3 text-base">
                    Get Started Free
                  </Link>
                  <Link href="/login" onClick={closeMobile} className="btn-secondary w-full py-3 text-base">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
