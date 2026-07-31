import { supabase } from "@/integrations/supabase/client";
import { buildIlikeOr, sanitizeSearchTerm } from "@/lib/supabase-filters";
import type { Customer, CustomerFilters, PaginatedResult, PaginationState } from "@/types";

export interface CustomerListItem extends Customer {
  branch: { name: string } | null;
}

export async function fetchCustomers(
  filters: CustomerFilters,
  pagination: PaginationState,
): Promise<PaginatedResult<CustomerListItem>> {
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  let query = supabase
    .from("customers")
    .select("*, branch:branches(name)", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  const search = sanitizeSearchTerm(filters.search);
  if (search) {
    query = query.or(buildIlikeOr(["full_name", "phone", "customer_code"], search));
  }
  if (filters.status !== "all") query = query.eq("recovery_status", filters.status);
  if (filters.branchId !== "all") query = query.eq("branch_id", filters.branchId);

  const { data, error, count } = await query;
  if (error) throw error;

  return { rows: (data ?? []) as CustomerListItem[], total: count ?? 0 };
}

export async function fetchBranches() {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, code")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data;
}
