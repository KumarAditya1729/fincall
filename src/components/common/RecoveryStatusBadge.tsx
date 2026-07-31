import { Badge } from "@/components/ui/badge";
import { RECOVERY_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import type { RecoveryStatus } from "@/types";

const toneByStatus: Record<RecoveryStatus, string> = {
  new: "bg-muted text-muted-foreground",
  in_progress: "bg-brand/10 text-brand",
  ptp: "bg-warning/15 text-warning",
  partially_paid: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  non_contactable: "bg-muted text-muted-foreground",
  legal: "bg-danger/10 text-danger",
  written_off: "bg-danger/10 text-danger",
};

export function RecoveryStatusBadge({ status }: { status: RecoveryStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", toneByStatus[status])}>
      {RECOVERY_STATUS_LABELS[status]}
    </Badge>
  );
}
