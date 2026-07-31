import { supabaseAdmin } from "../index";
import type { Job } from "../queue";

/**
 * Handles fanning out a bulk campaign into individual notification jobs.
 * This runs as a background job (type: 'campaign_launcher').
 */
export async function campaignLauncherHandler(
  job: Job,
  log: (msg: string, meta?: Record<string, unknown>) => Promise<void>,
  updateProgress: (progress: number) => Promise<void>,
) {
  const { campaign_id } = job.payload as { campaign_id: string };

  if (!campaign_id) {
    throw new Error("Missing campaign_id in payload");
  }

  // 1. Fetch Campaign
  const { data: campaign, error } = await supabaseAdmin
    .from("comm_campaigns")
    .select("*, comm_templates(*)")
    .eq("id", campaign_id)
    .single();

  if (error || !campaign) {
    throw new Error(`Failed to fetch campaign ${campaign_id}: ${error?.message}`);
  }

  await log(`Launching campaign ${campaign.name} (Type: ${campaign.type})`);

  // Mark as running
  await supabaseAdmin.from("comm_campaigns").update({ status: "running" }).eq("id", campaign_id);

  // 2. Fetch Target Audience (In a real scenario, this could run a complex SQL query to get 50,000 customers)
  // For demonstration, we assume target_audience contains a direct list of recipients or filter params.
  const targetRecipients: { recipient: string; variables: Record<string, unknown> }[] =
    campaign.target_audience?.recipients || [];

  if (targetRecipients.length === 0) {
    await log("No recipients found in target_audience.");
    await supabaseAdmin
      .from("comm_campaigns")
      .update({ status: "completed" })
      .eq("id", campaign_id);
    return;
  }

  const batchSize = 500;
  let processed = 0;

  // 3. Insert individual jobs in batches
  for (let i = 0; i < targetRecipients.length; i += batchSize) {
    const batch = targetRecipients.slice(i, i + batchSize);

    const jobsToInsert = batch.map((r) => ({
      type: `${campaign.type}_dispatch`, // sms_dispatch, email_dispatch, etc.
      priority: "medium", // Bulk campaigns usually have lower priority than transactional
      branch_id: campaign.branch_id,
      created_by: campaign.created_by,
      payload: {
        campaign_id,
        template_id: campaign.template_id,
        recipient: r.recipient,
        variables: r.variables || {},
        idempotency_key: `camp_${campaign_id}_${r.recipient}`,
      },
    }));

    const { error: insertError } = await supabaseAdmin.from("jobs").insert(jobsToInsert);

    if (insertError) {
      await log(`Error inserting batch ${i}: ${insertError.message}`);
      throw new Error(`Failed to enqueue campaign jobs: ${insertError.message}`);
    }

    processed += batch.length;
    await updateProgress(Math.round((processed / targetRecipients.length) * 100));
  }

  // Update stats initial count
  await supabaseAdmin
    .from("comm_campaigns")
    .update({
      stats: { ...campaign.stats, total: processed },
      status: "completed", // In a real system, status might stay 'running' until all child jobs finish
    })
    .eq("id", campaign_id);

  await log(`Campaign ${campaign_id} successfully fanned out ${processed} jobs.`);
}
