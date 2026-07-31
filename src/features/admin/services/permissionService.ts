import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types";

/**
 * Role/permission matrix.
 *
 * The matrix is advisory for the UI only — the database still enforces access
 * through RLS and the `has_permission` helper, so a tampered client cannot grant
 * itself capabilities by editing local state.
 */

export const PERMISSIONS = [
  { key: "branches.manage", label: "Manage branches", group: "Administration" },
  { key: "employees.manage", label: "Manage employees & roles", group: "Administration" },
  { key: "masters.manage", label: "Manage master data", group: "Administration" },
  { key: "imports.run", label: "Run data imports", group: "Administration" },
  { key: "customers.manage", label: "Create & edit borrowers", group: "Operations" },
  { key: "loans.manage", label: "Create & edit loans", group: "Operations" },
  { key: "payments.record", label: "Record payments", group: "Operations" },
  { key: "reports.export", label: "Export reports", group: "Operations" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export interface PermissionMatrix {
  [role: string]: Record<string, boolean>;
}

export async function fetchPermissionMatrix(): Promise<PermissionMatrix> {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("role, permission, allowed")
    .is("deleted_at", null);
  if (error) throw error;

  const matrix: PermissionMatrix = {};
  for (const row of data ?? []) {
    matrix[row.role] = { ...(matrix[row.role] ?? {}), [row.permission]: row.allowed };
  }
  return matrix;
}

const updateSchema = z.object({
  role: z.enum(["super_admin", "branch_manager", "recovery_executive"]),
  permission: z.enum(PERMISSIONS.map((permission) => permission.key) as [string, ...string[]]),
  allowed: z.boolean(),
});

export async function setPermission(
  role: AppRole,
  permission: string,
  allowed: boolean,
): Promise<void> {
  const parsed = updateSchema.parse({ role, permission, allowed });
  const { error } = await supabase
    .from("role_permissions")
    .upsert(
      { role: parsed.role, permission: parsed.permission, allowed: parsed.allowed },
      { onConflict: "role,permission" },
    );
  if (error) throw error;
}
