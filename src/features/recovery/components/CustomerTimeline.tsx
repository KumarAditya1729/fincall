import { CalendarClock, IndianRupee, MessageSquare, PhoneCall } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { TimelineEvent, TimelineKind } from "@/features/recovery/services/recoveryService";

const ICONS: Record<TimelineKind, typeof PhoneCall> = {
  call: PhoneCall,
  payment: IndianRupee,
  remark: MessageSquare,
  followup: CalendarClock,
};

const TONES: Record<TimelineEvent["tone"], string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  muted: "bg-muted text-muted-foreground",
};

interface CustomerTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

/** Reusable activity timeline shared by the customer profile and recovery views. */
export function CustomerTimeline({ events, isLoading = false }: CustomerTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing here yet"
        description="Calls, payments, remarks and follow-ups will appear as a single stream."
      />
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {events.map((event) => {
        const Icon = ICONS[event.kind];
        return (
          <li key={event.id} className="relative">
            <span
              className={cn(
                "absolute -left-[2.1rem] flex size-7 items-center justify-center rounded-full ring-4 ring-card",
                TONES[event.tone],
              )}
              aria-hidden="true"
            >
              <Icon className="size-3.5" />
            </span>
            <p className="text-sm font-medium text-foreground">{event.title}</p>
            {event.description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateTime(event.at)}
              {event.actor ? ` · ${event.actor}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
