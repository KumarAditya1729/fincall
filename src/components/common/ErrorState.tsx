import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

interface ErrorStateProps {
  error: unknown;
  onRetry?: (() => void) | undefined;
  title?: string;
}

/** Consistent, non-technical failure state for any data surface. */
export function ErrorState({ error, onRetry, title = "Something went wrong" }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
