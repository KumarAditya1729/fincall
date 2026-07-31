/**
 * Helpers that make user-supplied text safe inside PostgREST filter strings.
 *
 * PostgREST parses `or=(a.ilike.%x%,b.ilike.%y%)` as a comma/parenthesis
 * delimited grammar, so raw user input can inject extra predicates. Everything
 * that reaches `.or()` / `.ilike()` must go through these helpers.
 */

const MAX_SEARCH_LENGTH = 80;

/** Strips PostgREST grammar characters and LIKE wildcards from a search term. */
export function sanitizeSearchTerm(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(/[,()*%\\"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Builds a safe `or=(...)` expression matching the term against several columns. */
export function buildIlikeOr(columns: string[], term: string): string {
  const safe = sanitizeSearchTerm(term);
  return columns.map((column) => `${column}.ilike.%${safe}%`).join(",");
}
