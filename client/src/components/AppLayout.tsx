import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Map, CalendarCheck, ParkingSquare, BarChart3,
  Bell, Settings, LogIn, LogOut, ChevronLeft, ChevronRight, Menu, X, User
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Map, label: "Map View" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/bookings", icon: CalendarCheck, label: "Bookings" },
  { href: "/stations", icon: ParkingSquare, label: "Stations" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
];

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const { data: alerts = [] } = trpc.alerts.list.useQuery({ unreadOnly: true });
  const unreadCount = alerts.length;

  return (
    <div className="flex h-full bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 md:z-auto flex flex-col bg-white border-r border-border h-full
          transition-all duration-200 ease-in-out flex-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "w-[64px]" : "w-[220px]"}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-[62px] border-b border-border px-4 flex-none ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-8 h-8 rounded-xl bg-[oklch(0.58_0.22_27)] flex items-center justify-center flex-none shadow-sm">
            <ParkingSquare className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-[16px] tracking-tight text-foreground truncate">ParkFinder</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer
                ${isActive
                  ? "bg-[oklch(0.58_0.22_27)] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4.5 h-4.5 flex-none" />
              {!collapsed && <span className="truncate">{label}</span>}
            </div>
          </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex-none border-t border-border px-2 py-3 space-y-0.5">
          {/* Alerts */}
          <Link href="/alerts" onClick={() => setMobileOpen(false)}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                ${location === "/alerts" ? "bg-[oklch(0.58_0.22_27)] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? "Alerts" : undefined}
            >
              <div className="relative flex-none">
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[oklch(0.58_0.22_27)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span>Alerts {unreadCount > 0 && <span className="ml-1 text-xs bg-[oklch(0.58_0.22_27)] text-white rounded-full px-1.5 py-0.5">{unreadCount}</span>}</span>}
            </div>
          </Link>

          {/* Settings */}
          <Link href="/settings" onClick={() => setMobileOpen(false)}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                ${location === "/settings" ? "bg-[oklch(0.58_0.22_27)] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? "Settings" : undefined}
            >
              <Settings className="w-4.5 h-4.5 flex-none" />
              {!collapsed && <span>Settings</span>}
            </div>
          </Link>

          {/* User */}
          <div className={`flex items-center gap-2.5 px-3 py-2.5 mt-1 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-none">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{user?.name ?? "Guest"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.role ?? "visitor"}</p>
              </div>
            )}
            {!collapsed && (
              isAuthenticated ? (
                <button onClick={() => logout()} className="text-muted-foreground hover:text-foreground transition-colors" title="Sign out">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <a href={getLoginUrl()} className="text-muted-foreground hover:text-foreground transition-colors" title="Sign in">
                  <LogIn className="w-3.5 h-3.5" />
                </a>
              )
            )}
          </div>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="hidden md:flex absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white border border-border shadow-sm items-center justify-center hover:bg-muted transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-[62px] px-4 border-b border-border bg-white flex-none gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.58_0.22_27)] flex items-center justify-center">
              <ParkingSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[15px] text-foreground">ParkFinder</span>
          </div>
        </div>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
