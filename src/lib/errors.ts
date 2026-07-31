import { toast } from "sonner";

/**
 * Normalises anything thrown (Error, Supabase PostgrestError, string) into a
 * message that is safe to show a user. Raw database internals are replaced by
 * friendly copy so we never leak schema details into the UI.
 */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const candidate = error as { message?: unknown; code?: unknown };
    const code = typeof candidate.code === "string" ? candidate.code : null;

    if (code === "42501" || code === "PGRST301") {
      return "You do not have permission to perform this action.";
    }
    if (code === "23505") return "That record already exists.";
    if (code === "23503") return "A related record is missing or was removed.";
    if (code === "23514") return "Some of the values entered are not valid.";

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      const message = candidate.message.trim();
      // Hide low-level Postgres/PostgREST noise from end users.
      if (/relation|column|syntax error|jwt|postgrest|violates/i.test(message)) return fallback;
      return message;
    }
  }

  return fallback;
}

export function toastError(error: unknown, fallback?: string): void {
  toast.error(getErrorMessage(error, fallback));
}
