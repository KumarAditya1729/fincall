import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { MAX_IMPORT_ROWS, readSpreadsheet, type SheetRow } from "@/lib/excel";
import type { PaginatedResult, PaginationState } from "@/types";

/**
 * Excel/CSV import.
 *
 * The browser only turns the file into rows and gives the user a preview. All
 * authoritative validation — required fields, duplicate codes, branch scope and
 * permissions — happens inside the `import_customers` / `import_loans` database
 * routines, which also write the batch record and the per-row error report.
 */

export type ImportEntity = "customers" | "loans";

export const CUSTOMER_IMPORT_COLUMNS = [
  "customer_code",
  "full_name",
  "phone",
  "alternate_phone",
  "email",
  "address_line",
  "city",
  "state",
  "pincode",
  "kyc_id",
] as const;

export const LOAN_IMPORT_COLUMNS = [
  "loan_number",
  "customer_code",
  "product_name",
  "principal_amount",
  "outstanding_amount",
  "emi_amount",
  "overdue_amount",
  "days_past_due",
  "tenure_months",
  "interest_rate",
  "disbursed_on",
  "next_due_date",
] as const;

export const REQUIRED_COLUMNS: Record<ImportEntity, readonly string[]> = {
  customers: ["customer_code", "full_name", "phone"],
  loans: ["loan_number", "customer_code"],
};

export interface RowIssue {
  row: number;
  reason: string;
}

export interface ParsedImport {
  rows: SheetRow[];
  /** Issues detected in the browser preview; the server re-checks everything. */
  previewIssues: RowIssue[];
}

export async function parseImportFile(entity: ImportEntity, file: File): Promise<ParsedImport> {
  const rows = await readSpreadsheet(file);
  const required = REQUIRED_COLUMNS[entity];
  const previewIssues: RowIssue[] = [];

  rows.forEach((row, index) => {
    const missing = required.filter((column) => !row[column]);
    if (missing.length > 0) {
      previewIssues.push({ row: index + 1, reason: `Missing ${missing.join(", ")}` });
    }
  });

  return { rows, previewIssues };
}

const resultSchema = z.object({
  batchId: z.string().uuid(),
  total: z.number(),
  success: z.number(),
  failed: z.number(),
  errors: z.array(z.object({ row: z.number(), reason: z.string() })).default([]),
});

export type ImportResult = z.infer<typeof resultSchema>;

const runSchema = z.object({
  entity: z.enum(["customers", "loans"]),
  fileName: z.string().trim().min(1).max(200),
  branchId: z.string().uuid().nullable(),
  rows: z.array(z.record(z.string(), z.string())).min(1, "The file has no rows").max(MAX_IMPORT_ROWS),
});

export async function runImport(input: {
  entity: ImportEntity;
  fileName: string;
  branchId: string | null;
  rows: SheetRow[];
}): Promise<ImportResult> {
  const parsed = runSchema.parse(input);

  if (parsed.entity === "customers") {
    if (!parsed.branchId) throw new Error("Select the branch these borrowers belong to.");
    const { data, error } = await supabase.rpc("import_customers", {
      _rows: parsed.rows as never,
      _branch_id: parsed.branchId,
      _file_name: parsed.fileName,
    });
    if (error) throw error;
    return resultSchema.parse(data);
  }

  const { data, error } = await supabase.rpc("import_loans", {
    _rows: parsed.rows as never,
    _file_name: parsed.fileName,
  });
  if (error) throw error;
  return resultSchema.parse(data);
}

export interface ImportBatch {
  id: string;
  entity_type: string;
  file_name: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  errors: RowIssue[];
  created_at: string;
}

export async function fetchImportBatches(
  filters: { entity: ImportEntity | "all" },
  pagination: PaginationState,
): Promise<PaginatedResult<ImportBatch>> {
  const from = (pagination.page - 1) * pagination.pageSize;
  let query = supabase
    .from("import_batches")
    .select("id, entity_type, file_name, total_rows, success_rows, failed_rows, errors, created_at", {
      count: "exact",
    })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, from + pagination.pageSize - 1);
  if (filters.entity !== "all") query = query.eq("entity_type", filters.entity);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      ...row,
      errors: Array.isArray(row.errors) ? (row.errors as unknown as RowIssue[]) : [],
    })),
    total: count ?? 0,
  };
}
