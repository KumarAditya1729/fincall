/**
 * CSV export shared by every admin and list screen.
 *
 * Values are always quoted and a leading `=`, `+`, `-` or `@` is prefixed with a
 * single quote so a spreadsheet never evaluates exported borrower data as a
 * formula (CSV injection).
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const raw = String(value);
  const guarded = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((column) => escapeCell(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(","));
  return [head, ...body].join("\r\n");
}

/** Triggers a browser download of `rows` as a CSV file. */
export function downloadCsv<T>(fileName: string, rows: T[], columns: CsvColumn<T>[]): void {
  const blob = new Blob([`\uFEFF${toCsv(rows, columns)}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
