import { supabase } from "@/integrations/supabase/client";
import { sanitizeSearchTerm } from "@/lib/supabase-filters";

export interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  user_id: string | null;
  user: { full_name: string | null } | null;
}

export async function fetchAuditLogs(page: number, pageSize: number, search: string) {
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("audit_logs")
    .select(
      "id, action, entity_type, entity_id, created_at, user_id, user:profiles!audit_logs_user_id_fkey(full_name)",
      {
        count: "exact",
      },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const term = sanitizeSearchTerm(search);
  if (term) query = query.ilike("action", `%${term}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as AuditLogRow[], total: count ?? 0 };
}
