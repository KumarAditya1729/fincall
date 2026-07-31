import { supabaseAdmin } from "./index";
import { importCustomersHandler, importLoansHandler } from "./handlers/importHandler";
import { communicationDispatcher } from "./communication/dispatcher";
import { campaignLauncherHandler } from "./communication/campaigns";

export type Job = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  branch_id: string | null;
  created_by: string | null;
};

type JobHandler = (
  job: Job,
  log: (msg: string, meta?: Record<string, unknown>) => Promise<void>,
  updateProgress: (progress: number) => Promise<void>,
) => Promise<void>;

const HANDLERS: Record<string, JobHandler> = {
  customer_import: importCustomersHandler,
  loan_import: importLoansHandler,
  campaign_launcher: campaignLauncherHandler,
  // Generic Enterprise Communication Handlers
  sms_dispatch: async (job, log) => {
    await communicationDispatcher(job, "sms", log);
  },
  whatsapp_dispatch: async (job, log) => {
    await communicationDispatcher(job, "whatsapp", log);
  },
  email_dispatch: async (job, log) => {
    await communicationDispatcher(job, "email", log);
  },
  ai_scoring: async (job, log) => {
    await log("AI scoring stub executed");
  },
  daily_report: async (job, log) => {
    await log("Report generation stub executed");
  },
  archive_logs: async (job, log) => {
    await log("Log archival stub executed");
  },
  telephony_sync: async (job, log) => {
    await log("Telephony sync stub executed");
  },
};

const POLLING_INTERVAL_MS = 2000;
let isPolling = false;

export async function startQueueListener(workerId: string) {
  isPolling = true;
  console.log(`[Queue] Started polling for jobs...`);

  while (isPolling) {
    try {
      // 1. Dequeue atomic lock
      const { data, error } = await supabaseAdmin.rpc("dequeue_job", { p_worker_id: workerId });

      if (error) {
        console.error("[Queue] Error dequeueing job:", error);
        await sleep(POLLING_INTERVAL_MS);
        continue;
      }

      if (!data || data.length === 0) {
        // No jobs in queue
        await sleep(POLLING_INTERVAL_MS);
        continue;
      }

      const job: Job = data[0];
      console.log(`[Queue] Locked job ${job.id} of type ${job.type}`);

      // 2. Setup utilities
      const writeLog = async (
        level: "info" | "warn" | "error",
        msg: string,
        meta: Record<string, unknown> = {},
      ) => {
        await supabaseAdmin
          .from("job_logs")
          .insert({ job_id: job.id, level, message: msg, metadata: meta });
      };

      const logInfo = (msg: string, meta?: Record<string, unknown>) =>
        writeLog("info", msg, meta || {});
      const updateProgress = async (progress: number) => {
        await supabaseAdmin.from("jobs").update({ progress }).eq("id", job.id);
      };

      await logInfo(`Started processing job ${job.type}`);

      // 3. Execute
      const handler = HANDLERS[job.type];
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      try {
        await handler(job, logInfo, updateProgress);

        // Success
        await supabaseAdmin
          .from("jobs")
          .update({
            status: "completed",
            progress: 100,
            finished_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        await logInfo(`Successfully completed job`);
        console.log(`[Queue] Completed job ${job.id}`);
      } catch (err: unknown) {
        // Handle Failure
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Queue] Job ${job.id} failed:`, errorMsg);

        const newAttempts = job.attempts + 1;
        const isPermanent = newAttempts >= job.max_attempts;

        if (isPermanent) {
          // Dead letter queue
          await supabaseAdmin
            .from("jobs")
            .update({
              status: "dead_letter",
              error_message: errorMsg,
              attempts: newAttempts,
              finished_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          await supabaseAdmin.from("job_failures").insert({
            job_id: job.id,
            error_details: errorMsg,
            stack_trace: err.stack || null,
          });

          await writeLog("error", `Job permanently failed and moved to DLQ: ${errorMsg}`);
        } else {
          // Retry with exponential backoff (e.g. 2s, 4s, 8s...)
          const backoffSecs = Math.pow(2, newAttempts);
          const nextRunAt = new Date(Date.now() + backoffSecs * 1000).toISOString();

          await supabaseAdmin
            .from("jobs")
            .update({
              status: "retrying",
              error_message: errorMsg,
              attempts: newAttempts,
              assigned_worker_id: null,
              locked_at: null,
              next_run_at: nextRunAt,
            })
            .eq("id", job.id);

          await writeLog("warn", `Job failed. Retrying at ${nextRunAt}. Error: ${errorMsg}`);
        }
      }
    } catch (err) {
      console.error("[Queue] Critical loop error:", err);
      await sleep(POLLING_INTERVAL_MS);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
