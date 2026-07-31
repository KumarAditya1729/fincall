/**
 * Spreadsheet reading for the admin import screens.
 *
 * Parsing happens in the browser purely to turn a file into rows; every value is
 * re-validated server-side by the `import_customers` / `import_loans` routines,
 * which own duplicate detection, branch scoping and permissions.
 */

export const MAX_IMPORT_ROWS = 2000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type SheetRow = Record<string, string>;

/** Normalises a header cell to the snake_case column keys the importers expect. */
function normaliseHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * The spreadsheet engine is only needed on the two admin import screens, so it is
 * loaded on demand instead of shipping in the main bundle.
 */
async function loadXlsx() {
  return import("xlsx");
}

export async function readSpreadsheet(file: File): Promise<SheetRow[]> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is larger than 5 MB. Split the file and import again.");
  }

  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("The file has no worksheets.");

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("The first worksheet could not be read.");

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (raw.length === 0) throw new Error("The file contains no data rows.");
  if (raw.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `The file has ${raw.length} rows. Import at most ${MAX_IMPORT_ROWS} at a time.`,
    );
  }

  return raw.map((row) => {
    const mapped: SheetRow = {};
    for (const [key, value] of Object.entries(row)) {
      const column = normaliseHeader(key);
      if (column) mapped[column] = String(value ?? "").trim();
    }
    return mapped;
  });
}

/** Builds a downloadable template workbook so users know the expected columns. */
export async function downloadTemplate(fileName: string, columns: string[]): Promise<void> {
  const XLSX = await loadXlsx();
  const sheet = XLSX.utils.aoa_to_sheet([columns]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Template");
  XLSX.writeFile(workbook, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}
