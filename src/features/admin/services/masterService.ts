import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { sanitizeSearchTerm } from "@/lib/supabase-filters";
import type { PaginatedResult, PaginationState } from "@/types";

/**
 * Master data (dropdown catalogues) behind a single row shape so one panel can
 * manage every list. Call outcomes live in `call_status` because the calling
 * module already reads that table; everything else lives in `master_items`.
 */

export const MASTER_KINDS = ["recovery_status", "purpose", "talked_with", "call_outcome"] as const;
export type MasterKind = (typeof MASTER_KINDS)[number];

export interface MasterRow {
  id: string;
  label: string;
  code: string | null;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  /** Only meaningful for call outcomes. */
  isConnected: boolean | null;
  deletedAt: string | null;
  updatedAt: string;
}

export interface MasterFilters {
  search: string;
  status: "active" | "inactive" | "deleted";
}

export const masterSchema = z.object({
  label: z.string().trim().min(2, "Label must be at least 2 characters").max(120),
  code: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9_]*$/, "Code may only contain lowercase letters, numbers and underscores")
    .optional()
    .or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
  isConnected: z.boolean(),
});

export type MasterInput = z.infer<typeof masterSchema>;

function codeFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function applyStatus<
  T extends {
    is: (c: string, v: null) => T;
    not: (c: string, o: string, v: null) => T;
    eq: (c: string, v: boolean) => T;
  },
>(query: T, status: MasterFilters["status"]): T {
  if (status === "deleted") return query.not("deleted_at", "is", null);
  return query.is("deleted_at", null).eq("is_active", status === "active");
}

export async function fetchMasterRows(
  kind: MasterKind,
  filters: MasterFilters,
  pagination: PaginationState,
): Promise<PaginatedResult<MasterRow>> {
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;
  const search = sanitizeSearchTerm(filters.search);

  if (kind === "call_outcome") {
    let query = supabase
      .from("call_status")
      .select("*", { count: "exact" })
      .order("sort_order")
      .range(from, to);
    query = applyStatus(query, filters.status);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    return {
      rows: (data ?? []).map((row) => ({
        id: row.id,
        label: row.name,
        code: null,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        isSystem: false,
        isConnected: row.is_connected,
        deletedAt: row.deleted_at,
        updatedAt: row.updated_at,
      })),
      total: count ?? 0,
    };
  }

  let query = supabase
    .from("master_items")
    .select("*", { count: "exact" })
    .eq("type", kind)
    .order("sort_order")
    .range(from, to);
  query = applyStatus(query, filters.status);
  if (search) query = query.ilike("label", `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    rows: (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      code: row.code,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      isSystem: row.is_system,
      isConnected: null,
      deletedAt: row.deleted_at,
      updatedAt: row.updated_at,
    })),
    total: count ?? 0,
  };
}

export async function createMasterRow(kind: MasterKind, input: MasterInput): Promise<void> {
  const parsed = masterSchema.parse(input);

  if (kind === "call_outcome") {
    const { error } = await supabase.from("call_status").insert({
      name: parsed.label,
      sort_order: parsed.sortOrder,
      is_active: parsed.isActive,
      is_connected: parsed.isConnected,
    });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("master_items").insert({
    type: kind,
    code: parsed.code || codeFromLabel(parsed.label),
    label: parsed.label,
    sort_order: parsed.sortOrder,
    is_active: parsed.isActive,
  });
  if (error) throw error;
}

export async function updateMasterRow(
  kind: MasterKind,
  id: string,
  input: MasterInput,
): Promise<void> {
  const parsed = masterSchema.parse(input);

  if (kind === "call_outcome") {
    const { error } = await supabase
      .from("call_status")
      .update({
        name: parsed.label,
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
        is_connected: parsed.isConnected,
      })
      .eq("id", id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("master_items")
    .update({
      code: parsed.code || codeFromLabel(parsed.label),
      label: parsed.label,
      sort_order: parsed.sortOrder,
      is_active: parsed.isActive,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setMasterRowsDeleted(
  kind: MasterKind,
  ids: string[],
  deleted: boolean,
): Promise<void> {
  if (ids.length === 0) return;
  const table = kind === "call_outcome" ? "call_status" : "master_items";
  const patch = deleted
    ? { deleted_at: new Date().toISOString(), is_active: false }
    : { deleted_at: null, is_active: true };
  const { error } = await supabase.from(table).update(patch).in("id", ids);
  if (error) throw error;
}

/** Active options for a master list, used by the calling and recovery screens. */
export async function fetchMasterOptions(kind: Exclude<MasterKind, "call_outcome">) {
  const { data, error } = await supabase
    .from("master_items")
    .select("code, label")
    .eq("type", kind)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => ({ value: row.code, label: row.label }));
}
