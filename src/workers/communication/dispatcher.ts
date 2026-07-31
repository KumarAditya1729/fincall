import { supabaseAdmin } from "../index";
import type { Job } from "../queue";
import { ProviderFactory } from "./providers";
import type { CommunicationType } from "./providers/types";

function renderTemplate(content: string, variables: Record<string, unknown>): string {
  // Simple Handlebars style replacement: {{variable_name}}
  let rendered = content;
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = String(value ?? "");
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    rendered = rendered.replace(regex, safeValue);
  }
  return rendered;
}

export async function communicationDispatcher(
  job: Job,
  type: CommunicationType,
  log: (msg: string, meta?: Record<string, unknown>) => Promise<void>,
) {
  const {
    recipient,
    template_id,
    variables = {},
    campaign_id = null,
    idempotency_key = null,
  } = job.payload as {
    recipient: string;
    template_id: string;
    variables?: Record<string, unknown>;
    campaign_id?: string | null;
    idempotency_key?: string | null;
  };

  const branchId = job.branch_id;
  if (!branchId || !recipient || !template_id) {
    throw new Error("Missing required payload fields: branchId, recipient, or template_id");
  }

  // 1. Idempotency Check
  if (idempotency_key) {
    const { data: existing } = await supabaseAdmin
      .from("comm_history")
      .select("id, status")
      .eq("idempotency_key", idempotency_key)
      .single();

    if (existing && (existing.status === "sent" || existing.status === "delivered")) {
      await log(`Idempotency hit: Message already sent successfully (Key: ${idempotency_key})`);
      return; // Already processed
    }
  }

  // 2. Fetch Template
  const { data: template, error: tplError } = await supabaseAdmin
    .from("comm_templates")
    .select("content")
    .eq("id", template_id)
    .single();

  if (tplError || !template) {
    throw new Error(`Failed to fetch template ${template_id}`);
  }

  const renderedContent = renderTemplate(template.content, variables);

  // 3. Get Providers
  const activeProviders = await ProviderFactory.getActiveProviders(branchId, type);
  if (activeProviders.length === 0) {
    throw new Error(`No active ${type} providers configured for branch ${branchId}`);
  }

  // 4. Dispatch with Failover
  let finalStatus = "failed";
  let lastError = "No providers attempted";
  let successfulProvider = null;

  for (const { provider, config } of activeProviders) {
    await log(`Attempting dispatch via ${provider.name}`);
    const result = await provider.dispatch(recipient, renderedContent, config.config, branchId);

    if (result.success) {
      finalStatus = "sent";
      successfulProvider = provider.name;
      lastError = "";
      await log(`Dispatch successful via ${provider.name}`);
      break; // Stop at first success
    } else {
      lastError = result.errorReason || "Unknown failure";
      await log(`Dispatch failed via ${provider.name}: ${lastError}`);
      // Continue to next provider in the failover chain
    }
  }

  // 5. Write History
  const { error: histError } = await supabaseAdmin.from("comm_history").insert({
    job_id: job.id,
    campaign_id,
    branch_id: branchId,
    type,
    provider_name: successfulProvider,
    recipient,
    status: finalStatus,
    error_reason: finalStatus === "failed" ? lastError : null,
    idempotency_key,
    sent_at: finalStatus === "sent" ? new Date().toISOString() : null,
  });

  if (histError) {
    await log(`Failed to write comm_history: ${histError.message}`);
  }

  if (finalStatus === "failed") {
    // If all providers failed, throw to trigger the job queue's DLQ/Retry mechanism
    throw new Error(`All providers failed. Last error: ${lastError}`);
  }
}
