import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Building2, Code2, BookOpen, CheckSquare, Settings,
  LogOut, Search, PanelLeftClose, PanelLeft, Menu, X,
} from "lucide-react";
import { auth } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/leetcode", label: "LeetCode", icon: Code2 },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/tasks", label: "Daily Tasks", icon: CheckSquare },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const user = auth.useUser();

  const active = NAV.find((n) => pathname.startsWith(n.to));
  const title = active?.label ?? "PlacementOS";

  const handleLogout = () => {
    auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3 md:hidden">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="mono text-sm tracking-tight">
          <span className="text-brand">✓</span> PlacementOS
        </span>
        <div className="h-8 w-8 rounded-full bg-surface hairline grid place-items-center text-xs mono">
          {user?.name?.[0] ?? "U"}
        </div>
      </div>

      <div className="flex w-full">
        {/* Sidebar - desktop */}
        <aside
          className={cn(
            "hidden md:flex sticky top-0 h-screen shrink-0 flex-col border-r border-hairline bg-surface/50 backdrop-blur",
            collapsed ? "w-[68px]" : "w-64",
          )}
        >
          <SidebarInner collapsed={collapsed} pathname={pathname} onToggle={() => setCollapsed((v) => !v)} user={user} onLogout={handleLogout} />
        </aside>

        {/* Sidebar - mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 bg-surface border-r border-hairline flex flex-col">
              <div className="flex justify-end p-2 border-b border-hairline">
                <button onClick={() => setMobileOpen(false)} className="p-2" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarInner collapsed={false} pathname={pathname} user={user} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar - desktop */}
          <div className="hidden md:flex sticky top-0 z-30 items-center gap-4 border-b border-hairline bg-background/80 backdrop-blur px-8 py-4">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <div className="ml-6 relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search…"
                className="w-full h-9 rounded-md bg-surface hairline pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="mono text-xs text-muted-foreground">{user?.email ?? "guest@placementos.dev"}</div>
              <div className="h-9 w-9 rounded-full bg-surface hairline grid place-items-center mono text-sm">
                {user?.name?.[0] ?? "U"}
              </div>
            </div>
          </div>

          <div className="grid-bg relative min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1400px] px-5 py-6 md:px-8 md:py-10">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarInner({
  collapsed, pathname, onToggle, user, onLogout, onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onToggle?: () => void;
  user: ReturnType<typeof auth.useUser>;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between h-16 px-4 border-b border-hairline">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2 min-w-0">
          <span className="text-brand text-lg">✓</span>
          {!collapsed && <span className="mono text-sm truncate">PlacementOS</span>}
        </Link>
        {onToggle && (
          <button onClick={onToggle} className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground" aria-label="Toggle sidebar">
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const isActive = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-hairline p-3">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="rounded-md bg-surface-2 hairline px-3 py-2">
              <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Signed in</div>
              <div className="text-xs truncate">{user?.email ?? "guest@placementos.dev"}</div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-coral hover:bg-surface-2 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="w-full grid place-items-center py-2 rounded-md text-muted-foreground hover:text-coral hover:bg-surface-2"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );
}
