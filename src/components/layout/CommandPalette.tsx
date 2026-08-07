import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  LayoutDashboard,
  PhoneCall,
  Settings,
  ShieldCheck,
  Server,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { QUERY_KEYS } from "@/constants";
import { hasRole, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { fetchCustomers } from "@/features/customers/services/customerService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { AppRole } from "@/types";

type CurrentUser = NonNullable<ReturnType<typeof useCurrentUser>["data"]>;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: CurrentUser | null | undefined;
}

const DESTINATIONS: { to: string; label: string; icon: typeof Users; roles: AppRole[] }[] = [
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
  { to: "/admin/branches", label: "Branches", icon: Settings, roles: ["super_admin"] },
  { to: "/admin/employees", label: "Employees", icon: Settings, roles: ["super_admin"] },
  { to: "/admin/jobs", label: "Background Jobs", icon: Server, roles: ["super_admin"] },
  { to: "/admin/imports", label: "Data Imports", icon: Settings, roles: ["super_admin"] },
  { to: "/admin/settings", label: "Company Settings", icon: Settings, roles: ["super_admin"] },
  { to: "/audit-logs", label: "Audit Logs", icon: ShieldCheck, roles: ["super_admin"] },
];

export function CommandPalette({ open, onOpenChange, user }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const search = useDebouncedValue(term.trim(), 250);

  useEffect(() => {
    if (!open) setTerm("");
  }, [open]);

  const destinations = DESTINATIONS.filter((item) =>
    item.roles.some((role) => hasRole(user, role)),
  );

  const customers = useQuery({
    queryKey: [...QUERY_KEYS.customers, "palette", search],
    queryFn: () =>
      fetchCustomers({ search, status: "all", branchId: "all" }, { page: 1, pageSize: 6 }),
    enabled: open && search.length >= 2,
    staleTime: 30_000,
  });

  function go(to: string) {
    onOpenChange(false);
    void navigate({ to });
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search customers or jump to a page"
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search customers, or jump to a page…"
        value={term}
        onValueChange={setTerm}
      />
      <CommandList>
        <CommandEmpty>
          {search.length >= 2 && !customers.isLoading
            ? "No matches found."
            : "Type at least 2 characters to search customers."}
        </CommandEmpty>

        {search.length >= 2 ? (
          <CommandGroup heading={customers.isLoading ? "Searching customers…" : "Customers"}>
            {(customers.data?.rows ?? []).map((customer) => (
              <CommandItem
                key={customer.id}
                value={customer.id}
                onSelect={() => {
                  onOpenChange(false);
                  void navigate({
                    to: "/customers/$customerId",
                    params: { customerId: customer.id },
                  });
                }}
              >
                <Users className="size-4" aria-hidden="true" />
                <span className="truncate">{customer.full_name}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {customer.customer_code ?? customer.phone}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {search.length >= 2 ? <CommandSeparator /> : null}

        <CommandGroup heading="Go to">
          {destinations
            .filter((item) => item.label.toLowerCase().includes(term.trim().toLowerCase()))
            .map((item) => (
              <CommandItem key={item.to} value={item.to} onSelect={() => go(item.to)}>
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
