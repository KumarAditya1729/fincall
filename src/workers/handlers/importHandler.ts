import { supabaseAdmin } from "../index";
import type { Job } from "../queue";
import * as xlsx from "xlsx";

export async function importCustomersHandler(
  job: Job,
  log: (msg: string, meta?: Record<string, unknown>) => Promise<void>,
  updateProgress: (progress: number) => Promise<void>,
) {
  const { filePath } = job.payload;
  if (!filePath) throw new Error("Missing filePath in payload");

  await log(`Downloading file from storage: ${filePath}`);

  const { data, error } = await supabaseAdmin.storage.from("job_files").download(filePath);

  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message || "Unknown"}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const workbook = xlsx.read(arrayBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

  const totalRows = rows.length;
  await log(`Found ${totalRows} rows to import`);

  if (totalRows === 0) {
    await log("No rows found. Completing.");
    return;
  }

  // Process in chunks of 500
  const CHUNK_SIZE = 500;
  let successCount = 0;

  for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);

    // Call the database function to import (respects internal rules)
    const { error: rpcError } = await supabaseAdmin.rpc("import_customers", {
      _rows: chunk as never,
      _branch_id: job.branch_id,
      _file_name: filePath.split("/").pop() || "unknown",
    });

    if (rpcError) {
      throw new Error(`Chunk ${i}-${i + chunk.length} failed: ${rpcError.message}`);
    }

    successCount += chunk.length;

    // Update progress
    const progress = Math.floor((successCount / totalRows) * 100);
    await updateProgress(progress);
    await log(`Imported ${successCount}/${totalRows} rows`);
  }

  await log(`Successfully imported ${successCount} customers`);
}

export async function importLoansHandler(
  job: Job,
  log: (msg: string, meta?: Record<string, unknown>) => Promise<void>,
  updateProgress: (progress: number) => Promise<void>,
) {
  const { filePath } = job.payload;
  if (!filePath) throw new Error("Missing filePath in payload");

  await log(`Downloading file from storage: ${filePath}`);

  const { data, error } = await supabaseAdmin.storage.from("job_files").download(filePath);

  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message || "Unknown"}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const workbook = xlsx.read(arrayBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

  const totalRows = rows.length;
  await log(`Found ${totalRows} rows to import`);

  if (totalRows === 0) return;

  const CHUNK_SIZE = 500;
  let successCount = 0;

  for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);

    const { error: rpcError } = await supabaseAdmin.rpc("import_loans", {
      _rows: chunk as never,
      _file_name: filePath.split("/").pop() || "unknown",
    });

    if (rpcError) {
      throw new Error(`Chunk ${i}-${i + chunk.length} failed: ${rpcError.message}`);
    }

    successCount += chunk.length;
    const progress = Math.floor((successCount / totalRows) * 100);
    await updateProgress(progress);
    await log(`Imported ${successCount}/${totalRows} rows`);
  }

  await log(`Successfully imported ${successCount} loans`);
}
