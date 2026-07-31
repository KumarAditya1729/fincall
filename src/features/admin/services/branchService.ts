import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { buildIlikeOr, sanitizeSearchTerm } from "@/lib/supabase-filters";
import type { Branch, PaginatedResult, PaginationState } from "@/types";

export interface BranchFilters {
  search: string;
  /** `all` also includes soft-deleted branches so admins can restore them. */
  status: "active" | "inactive" | "deleted" | "all";
}

export const branchSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Code may only contain letters, numbers and hyphens"),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, "Phone may only contain digits")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean(),
});

export type BranchInput = z.infer<typeof branchSchema>;

function normalise(input: BranchInput) {
  const parsed = branchSchema.parse(input);
  return {
    name: parsed.name,
    code: parsed.code.toUpperCase(),
    city: parsed.city || null,
    state: parsed.state || null,
    phone: parsed.phone || null,
    is_active: parsed.is_active,
  };
}

export async function fetchBranchPage(
  filters: BranchFilters,
  pagination: PaginationState,
): Promise<PaginatedResult<Branch>> {
  const from = (pagination.page - 1) * pagination.pageSize;

  let query = supabase
    .from("branches")
    .select("*", { count: "exact" })
    .order("name")
    .range(from, from + pagination.pageSize - 1);

  if (filters.status === "deleted") query = query.not("deleted_at", "is", null);
  else if (filters.status !== "all") {
    query = query.is("deleted_at", null).eq("is_active", filters.status === "active");
  } else query = query.is("deleted_at", null);

  const search = sanitizeSearchTerm(filters.search);
  if (search) query = query.or(buildIlikeOr(["name", "code", "city"], search));

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Branch[], total: count ?? 0 };
}

export async function createBranch(input: BranchInput): Promise<void> {
  const { error } = await supabase.from("branches").insert(normalise(input));
  if (error) throw error;
}

export async function updateBranch(id: string, input: BranchInput): Promise<void> {
  const { error } = await supabase.from("branches").update(normalise(input)).eq("id", id);
  if (error) throw error;
}

/** Branches are never hard-deleted; history and audit rows must keep resolving. */
export async function softDeleteBranches(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("branches")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .in("id", ids);
  if (error) throw error;
}

export async function restoreBranches(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("branches")
    .update({ deleted_at: null, is_active: true })
    .in("id", ids);
  if (error) throw error;
}

export async function setBranchesActive(ids: string[], isActive: boolean): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("branches").update({ is_active: isActive }).in("id", ids);
  if (error) throw error;
}
