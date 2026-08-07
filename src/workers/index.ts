import { createClient } from "@supabase/supabase-js";
import http from "http";
import os from "os";
import { startQueueListener } from "./queue";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing VITE_SUPABASE_URL (or SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const hostname = os.hostname();
const pid = process.pid;
let workerId: string | null = null;
let isShuttingDown = false;

async function boot() {
  console.log(`[Worker] Booting on ${hostname}:${pid}`);

  // Start a dummy HTTP server to satisfy Render's port scan check for Web Services
  const port = process.env.PORT || 10000;
  http
    .createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    })
    .listen(port, () => {
      console.log(`[Worker] Health check server listening on port ${port}`);
    });

  // Register worker
  const { data, error } = await supabaseAdmin
    .from("workers")
    .insert({
      hostname,
      pid,
      status: "alive",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[Worker] Failed to register worker:", error);
    process.exit(1);
  }

  workerId = data.id;
  console.log(`[Worker] Registered with ID: ${workerId}`);

  // Start heartbeat
  const heartbeatInterval = setInterval(async () => {
    if (isShuttingDown) return;
    const { error } = await supabaseAdmin
      .from("workers")
      .update({ last_heartbeat_at: new Date().toISOString() })
      .eq("id", workerId);

    if (error) console.error("[Worker] Heartbeat failed:", error);
  }, 30000);

  // Start recovering stale jobs (every 2 minutes)
  const recoveryInterval = setInterval(async () => {
    if (isShuttingDown) return;
    await recoverStaleJobs();
  }, 120000);

  // Initial recovery run
  await recoverStaleJobs();

  // Start polling the queue
  await startQueueListener(workerId);

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    console.log(`\n[Worker] Received ${signal}. Gracefully shutting down...`);
    isShuttingDown = true;

    clearInterval(heartbeatInterval);
    clearInterval(recoveryInterval);

    if (workerId) {
      await supabaseAdmin.from("workers").update({ status: "offline" }).eq("id", workerId);
    }

    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

async function recoverStaleJobs() {
  console.log("[Worker] Checking for stale jobs...");
  // Find workers that haven't pulsed in 2 minutes
  const twoMinutesAgo = new Date(Date.now() - 120000).toISOString();

  const { data: deadWorkers } = await supabaseAdmin
    .from("workers")
    .select("id")
    .eq("status", "alive")
    .lt("last_heartbeat_at", twoMinutesAgo);

  if (deadWorkers && deadWorkers.length > 0) {
    const deadWorkerIds = deadWorkers.map((w) => w.id);
    console.log(`[Worker] Found ${deadWorkerIds.length} dead workers. Re-queueing their jobs...`);

    // Mark them offline
    await supabaseAdmin.from("workers").update({ status: "offline" }).in("id", deadWorkerIds);

    // Requeue their running jobs
    const { data: requeued } = await supabaseAdmin
      .from("jobs")
      .update({
        status: "queued",
        assigned_worker_id: null,
        locked_at: null,
      })
      .eq("status", "running")
      .in("assigned_worker_id", deadWorkerIds)
      .select("id");

    if (requeued && requeued.length > 0) {
      console.log(`[Worker] Re-queued ${requeued.length} stale jobs.`);
    }
  }
}

boot().catch(console.error);
