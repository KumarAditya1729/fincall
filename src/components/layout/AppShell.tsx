import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  LayoutDashboard,
  Target,
  LogOut,
  Menu,
  PhoneCall,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { APP_NAME, AUDIT_ACTIONS, ROLE_LABELS } from "@/constants";
import { recordAudit } from "@/features/audit/services/auditService";
import { signOut } from "@/features/auth/services/authService";
import { hasRole, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: AppRole[];
}

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Workspace",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["super_admin", "branch_manager", "recovery_executive"],
      },
      {
        to: "/today",
        label: "Today's Calls",
        icon: CalendarClock,
        roles: ["super_admin", "branch_manager", "recovery_executive"],
      },
      {
        to: "/recovery",
        label: "Recovery Queue",
        icon: Target,
        roles: ["super_admin", "branch_manager", "recovery_executive"],
      },
    ],
  },
  {
    heading: "Portfolio",
    items: [
      {
        to: "/customers",
        label: "Customers",
        icon: Users,
        roles: ["super_admin", "branch_manager", "recovery_executive"],
      },
      {
        to: "/calls",
        label: "Call History",
        icon: PhoneCall,
        roles: ["super_admin", "branch_manager", "recovery_executive"],
      },
    ],
  },
  {
    heading: "Governance",
    items: [
      {
        to: "/admin/branches",
        label: "Administration",
        icon: Settings,
        roles: ["super_admin"],
      },
      {
        to: "/audit-logs",
        label: "Audit Logs",
        icon: ShieldCheck,
        roles: ["super_admin"],
      },
    ],
  },
];

const PAGE_TITLES: { match: string; label: string }[] = [
  { match: "/dashboard", label: "Dashboard" },
  { match: "/today", label: "Today's Calls" },
  { match: "/recovery", label: "Recovery Queue" },
  { match: "/customers", label: "Customers" },
  { match: "/calls", label: "Call History" },
  { match: "/audit-logs", label: "Audit Logs" },
  { match: "/admin/branches", label: "Administration · Branches" },
  { match: "/admin/employees", label: "Administration · Employees" },
  { match: "/admin/permissions", label: "Administration · Permissions" },
  { match: "/admin/masters", label: "Administration · Master Data" },
  { match: "/admin/assignments", label: "Administration · Assignments" },
  { match: "/admin/imports", label: "Administration · Imports" },
  { match: "/admin/calendar", label: "Administration · Calendar" },
  { match: "/admin/templates", label: "Administration · Templates" },
  { match: "/admin/settings", label: "Administration · Company Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const role = user?.primaryRole ?? null;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.some((allowed) => hasRole(user, allowed))),
  })).filter((group) => group.items.length > 0);
  const currentPage = PAGE_TITLES.filter((entry) => pathname.startsWith(entry.match)).sort(
    (a, b) => b.match.length - a.match.length,
  )[0];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSignOut() {
    if (user) {
      await recordAudit({
        action: AUDIT_ACTIONS.LOGOUT,
        userId: user.id,
        branchId: user.branchId,
      });
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navigation = (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3">
      {groups.map((group) => (
        <div key={group.heading} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            {group.heading}
          </p>
          {group.items.map((item) => {
            const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand transition-opacity",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-[var(--shadow-card)]"
      >
        Skip to main content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar py-5 lg:flex">
        <BrandMark />
        {navigation}
        <div className="mt-auto px-6 pt-4">
          <p className="text-xs font-medium text-sidebar-foreground/70">
            {user?.profile?.full_name || user?.email || "—"}
          </p>
          <p className="text-xs text-sidebar-foreground/45">
            {role ? ROLE_LABELS[role] : "No role assigned"}
          </p>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col bg-sidebar py-5">
            <div className="flex items-center justify-between pr-3">
              <BrandMark />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            {navigation}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-2 text-sm">
              <li className="hidden text-muted-foreground sm:block">{APP_NAME}</li>
              <li className="hidden text-muted-foreground/50 sm:block" aria-hidden="true">
                /
              </li>
              <li className="min-w-0 truncate font-medium text-foreground">
                {currentPage?.label ?? "Workspace"}
              </li>
            </ol>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search customers and pages"
              className="hidden h-9 w-64 justify-start gap-2 px-3 text-muted-foreground md:flex"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="text-sm">Search…</span>
              <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Search customers and pages"
              onClick={() => setPaletteOpen(true)}
            >
              <Search className="size-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-brand/10 text-xs font-semibold text-brand">
                      {initialsOf(user?.profile?.full_name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-tight text-foreground">
                      {user?.profile?.full_name || user?.email}
                    </span>
                    <span className="block text-xs leading-tight text-muted-foreground">
                      {role ? ROLE_LABELS[role] : "—"}
                    </span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void handleSignOut()}>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8"
        >
          {children}
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} user={user} />
    </div>
  );
}

function BrandMark() {
  return (
    <div className="mb-6 flex items-center gap-2 px-6">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
        R
      </span>
      <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
        {APP_NAME}
      </span>
    </div>
  );
}
