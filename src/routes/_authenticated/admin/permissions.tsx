import { Fragment } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { QUERY_KEYS, ROLE_LABELS, ROLE_PRIORITY } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import {
  fetchPermissionMatrix,
  PERMISSIONS,
  setPermission,
} from "@/features/admin/services/permissionService";
import { toastError } from "@/lib/errors";
import type { AppRole } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/permissions")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions — Recovera" },
      {
        name: "description",
        content: "Configure which recovery capabilities each role can use across the platform.",
      },
      { property: "og:title", content: "Roles & Permissions — Recovera" },
      {
        property: "og:description",
        content: "Role-based access matrix for branch managers, executives and administrators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const queryClient = useQueryClient();
  const matrix = useQuery({
    queryKey: QUERY_KEYS.adminPermissions,
    queryFn: fetchPermissionMatrix,
  });

  const mutation = useMutation({
    mutationFn: (input: { role: AppRole; permission: string; allowed: boolean }) =>
      setPermission(input.role, input.permission, input.allowed),
    onSuccess: async () => {
      toast.success("Permission updated");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPermissions });
    },
    onError: (error) => toastError(error, "Could not update the permission"),
  });

  const groups = [...new Set(PERMISSIONS.map((permission) => permission.group))];

  return (
    <AppShell>
      <AdminGuard>
        <div className="space-y-6">
          <PageHeader
            title="Roles & permissions"
            description="Super admins always keep full access; the database re-checks every capability."
          />
          <AdminTabs />

          {matrix.isLoading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : matrix.error ? (
            <ErrorState error={matrix.error} onRetry={() => void matrix.refetch()} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">Role and permission matrix</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Capability
                    </th>
                    {ROLE_PRIORITY.map((role) => (
                      <th key={role} scope="col" className="px-4 py-3 font-medium">
                        {ROLE_LABELS[role]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <Fragment key={group}>
                      <tr className="bg-muted/40">
                        <th
                          scope="colgroup"
                          colSpan={ROLE_PRIORITY.length + 1}
                          className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {group}
                        </th>
                      </tr>
                      {PERMISSIONS.filter((permission) => permission.group === group).map(
                        (permission) => (
                          <tr key={permission.key} className="border-b border-border last:border-0">
                            <th scope="row" className="px-4 py-3 text-left font-normal">
                              {permission.label}
                            </th>
                            {ROLE_PRIORITY.map((role) => {
                              const locked = role === "super_admin";
                              const allowed =
                                locked || (matrix.data?.[role]?.[permission.key] ?? false);
                              return (
                                <td key={role} className="px-4 py-3">
                                  <Switch
                                    checked={allowed}
                                    disabled={locked || mutation.isPending}
                                    aria-label={`${permission.label} for ${ROLE_LABELS[role]}`}
                                    onCheckedChange={(checked) =>
                                      mutation.mutate({
                                        role,
                                        permission: permission.key,
                                        allowed: checked,
                                      })
                                    }
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ),
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminGuard>
    </AppShell>
  );
}
