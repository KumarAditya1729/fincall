import { supabase } from "@/integrations/supabase/client";
import type { CallLog, CallStatus, Customer, Followup, Loan, Remark } from "@/types";

export interface CustomerDetail extends Customer {
  branch: { id: string; name: string } | null;
  assignee: { full_name: string } | null;
}

export async function fetchCustomerById(customerId: string): Promise<CustomerDetail> {
  const { data, error } = await supabase
    .from("customers")
    .select("*, branch:branches(id, name), assignee:profiles!customers_assigned_to_fkey(full_name)")
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Customer not found");
  return data as unknown as CustomerDetail;
}

export async function fetchCustomerLoans(customerId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from("loans")
    .select("*")
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Loan[];
}

export interface CallLogWithMeta extends CallLog {
  status: { name: string; is_connected: boolean } | null;
  caller: { full_name: string } | null;
}

export async function fetchCustomerCalls(customerId: string): Promise<CallLogWithMeta[]> {
  const { data, error } = await supabase
    .from("call_logs")
    .select(
      "*, status:call_status(name, is_connected), caller:profiles!call_logs_called_by_fkey(full_name)",
    )
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("called_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as CallLogWithMeta[];
}

export async function fetchCustomerFollowups(customerId: string): Promise<Followup[]> {
  const { data, error } = await supabase
    .from("followups")
    .select("*")
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("scheduled_date", { ascending: true })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as Followup[];
}

export interface RemarkWithAuthor extends Remark {
  author: { full_name: string } | null;
}

export async function fetchCustomerRemarks(customerId: string): Promise<RemarkWithAuthor[]> {
  const { data, error } = await supabase
    .from("remarks")
    .select("*, author:profiles!remarks_author_id_fkey(full_name)")
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as RemarkWithAuthor[];
}

export async function fetchCallStatuses(): Promise<CallStatus[]> {
  const { data, error } = await supabase
    .from("call_status")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as CallStatus[];
}
