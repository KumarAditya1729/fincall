import { supabase } from "@/integrations/supabase/client";
import type { PaginatedResult, PaginationState } from "@/types";

export interface Job {
  id: string;
  type: string;
  priority: "critical" | "high" | "medium" | "low";
  status:
    | "queued"
    | "running"
    | "retrying"
    | "completed"
    | "cancelled"
    | "dead_letter"
    | "archived"
    | "paused";
  payload: Record<string, unknown>;
  progress: number;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  assigned_worker_id: string | null;
  branch_id: string | null;
  created_by: string | null;
  locked_at: string | null;
  next_run_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  hostname: string;
  pid: number;
  status: "alive" | "offline";
  last_heartbeat_at: string;
  started_at: string;
}

export interface JobLog {
  id: string;
  job_id: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function fetchJobs(
  pagination: PaginationState,
  filters: { status?: string; type?: string },
): Promise<PaginatedResult<Job>> {
  const from = (pagination.page - 1) * pagination.pageSize;
  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pagination.pageSize - 1);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { rows: data as Job[], total: count || 0 };
}

export async function fetchWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data as Worker[];
}

export async function fetchJobLogs(jobId: string): Promise<JobLog[]> {
  const { data, error } = await supabase
    .from("job_logs")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as JobLog[];
}

export async function retryJob(jobId: string) {
  const { error } = await supabase
    .from("jobs")
    .update({
      status: "queued",
      attempts: 0,
      error_message: null,
      assigned_worker_id: null,
      locked_at: null,
      next_run_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  if (error) throw error;
}

export async function retryAllFailed() {
  const { error } = await supabase
    .from("jobs")
    .update({
      status: "queued",
      attempts: 0,
      error_message: null,
      assigned_worker_id: null,
      locked_at: null,
      next_run_at: new Date().toISOString(),
    })
    .in("status", ["dead_letter"]);
  if (error) throw error;
}

export async function cancelJob(jobId: string) {
  const { error } = await supabase
    .from("jobs")
    .update({ status: "cancelled" })
    .eq("id", jobId)
    .in("status", ["queued", "retrying", "paused"]); // Only cancel if not already running
  if (error) throw error;
}

export async function pauseQueue() {
  const { error } = await supabase
    .from("jobs")
    .update({ status: "paused" })
    .in("status", ["queued", "retrying"]);
  if (error) throw error;
}

export async function resumeQueue() {
  const { error } = await supabase
    .from("jobs")
    .update({ status: "queued", next_run_at: new Date().toISOString() })
    .eq("status", "paused");
  if (error) throw error;
}

export async function purgeQueue() {
  const { error } = await supabase
    .from("jobs")
    .delete()
    .in("status", ["completed", "cancelled", "archived", "dead_letter"]);
  if (error) throw error;
}
