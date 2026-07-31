import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

/**
 * Bulk borrower operations.
 *
 * Both routines are `SECURITY DEFINER` so the multi-row update stays atomic, and
 * both re-check the caller's role and branch scope in SQL — the selection sent
 * from the browser is never trusted.
 */

const idsSchema = z
  .array(z.string().uuid())
  .min(1, "Select at least one borrower")
  .max(500, "Select at most 500 borrowers at a time");

export async function assignCustomers(
  customerIds: string[],
  assignedTo: string | null,
): Promise<number> {
  const ids = idsSchema.parse(customerIds);
  const assignee = assignedTo === null ? null : z.string().uuid().parse(assignedTo);

  const { data, error } = await supabase.rpc("assign_customers", {
    _customer_ids: ids,
    _assigned_to: assignee as string,
  });

  if (error) throw error;
  return Number(data ?? 0);
}

export async function transferCustomersBranch(
  customerIds: string[],
  branchId: string,
): Promise<number> {
  const ids = idsSchema.parse(customerIds);
  const branch = z.string().uuid("Select a destination branch").parse(branchId);

  const { data, error } = await supabase.rpc("transfer_customers_branch", {
    _customer_ids: ids,
    _branch_id: branch,
  });
  if (error) throw error;
  return Number(data ?? 0);
}
