import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export interface AdminSection {
  to: string;
  label: string;
}

/**
 * Sub-navigation for the administration area, so every admin screen shares one
 * consistent way of moving between settings modules.
 */
export const ADMIN_SECTIONS: AdminSection[] = [
  { to: "/admin/branches", label: "Branches" },
  { to: "/admin/employees", label: "Employees" },
  { to: "/admin/permissions", label: "Roles & permissions" },
  { to: "/admin/assignments", label: "Bulk transfers" },
  { to: "/admin/jobs", label: "Background Jobs" },
  { to: "/admin/imports", label: "Data import" },
  { to: "/admin/masters", label: "Master data" },
  { to: "/admin/calendar", label: "Calendar & hours" },
  { to: "/admin/templates", label: "Templates" },
  { to: "/admin/settings", label: "Company" },
];

export function AdminTabs({ sections = ADMIN_SECTIONS }: { sections?: AdminSection[] }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav aria-label="Administration sections" className="overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 rounded-xl border border-border bg-card p-1">
        {sections.map((section) => {
          const isActive = pathname === section.to;
          return (
            <li key={section.to}>
              <Link
                to={section.to}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-brand/10 text-brand",
                )}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
