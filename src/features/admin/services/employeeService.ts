import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { buildIlikeOr, sanitizeSearchTerm } from "@/lib/supabase-filters";
import type { AppRole, PaginatedResult, PaginationState, Profile } from "@/types";

export interface EmployeeRow extends Profile {
  branch: { id: string; name: string } | null;
  roles: AppRole[];
}

export interface EmployeeFilters {
  search: string;
  branchId: string | "all";
  role: AppRole | "all";
  status: "active" | "inactive" | "deleted" | "all";
}

export const employeeSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, "Phone may only contain digits")
    .optional()
    .or(z.literal("")),
  employee_code: z.string().trim().max(30).optional().or(z.literal("")),
  branch_id: z.string().uuid("Select a branch").nullable(),
  is_active: z.boolean(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

/**
 * Lists employees with their roles. Roles are fetched in a single follow-up
 * query keyed by the page's profile ids, never one query per row.
 */
export async function fetchEmployees(
  filters: EmployeeFilters,
  pagination: PaginationState,
): Promise<PaginatedResult<EmployeeRow>> {
  const from = (pagination.page - 1) * pagination.pageSize;

  let query = supabase
    .from("profiles")
    .select("*, branch:branches(id, name)", { count: "exact" })
    .order("full_name")
    .range(from, from + pagination.pageSize - 1);

  if (filters.status === "deleted") query = query.not("deleted_at", "is", null);
  else if (filters.status !== "all") {
    query = query.is("deleted_at", null).eq("is_active", filters.status === "active");
  } else query = query.is("deleted_at", null);

  if (filters.branchId !== "all") query = query.eq("branch_id", filters.branchId);

  const search = sanitizeSearchTerm(filters.search);
  if (search) query = query.or(buildIlikeOr(["full_name", "email", "employee_code"], search));

  const { data, error, count } = await query;
  if (error) throw error;

  const profiles = (data ?? []) as (Profile & { branch: { id: string; name: string } | null })[];
  const ids = profiles.map((profile) => profile.id);

  const roleMap = new Map<string, AppRole[]>();
  if (ids.length > 0) {
    const { data: roleRows, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);
    if (roleError) throw roleError;
    for (const row of roleRows ?? []) {
      roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role]);
    }
  }

  const rows = profiles.map((profile) => ({ ...profile, roles: roleMap.get(profile.id) ?? [] }));
  const roleFilter = filters.role;
  const filtered =
    roleFilter === "all" ? rows : rows.filter((row) => row.roles.includes(roleFilter));

  return { rows: filtered, total: count ?? 0 };
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<void> {
  const parsed = employeeSchema.parse(input);
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.full_name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      employee_code: parsed.employee_code || null,
      branch_id: parsed.branch_id,
      is_active: parsed.is_active,
    })
    .eq("id", id);
  if (error) throw error;
}

const rolesSchema = z.array(z.enum(["super_admin", "branch_manager", "recovery_executive"])).min(1);

/** Role changes run through a database routine that re-checks the caller. */
export async function setEmployeeRoles(userId: string, roles: AppRole[]): Promise<void> {
  const parsed = rolesSchema.parse(roles);
  const { error } = await supabase.rpc("admin_set_user_roles", {
    _user_id: userId,
    _roles: parsed,
  });
  if (error) throw error;
}

export async function setEmployeesActive(ids: string[], isActive: boolean): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).in("id", ids);
  if (error) throw error;
}

export async function softDeleteEmployees(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .in("id", ids);
  if (error) throw error;
}

export async function restoreEmployees(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: null, is_active: true })
    .in("id", ids);
  if (error) throw error;
}

/** Active employees for assignment pickers, optionally limited to one branch. */
export async function fetchAssignableEmployees(branchId?: string | null) {
  let query = supabase
    .from("profiles")
    .select("id, full_name, branch_id")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("full_name");
  if (branchId) query = query.eq("branch_id", branchId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
