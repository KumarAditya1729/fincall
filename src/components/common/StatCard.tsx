import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type StatTone = "brand" | "success" | "warning" | "danger" | "neutral";

const toneStyles: Record<StatTone, string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-muted text-muted-foreground",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
  isLoading?: boolean;
  to?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  hint,
  isLoading = false,
  to,
}: StatCardProps) {
  const inner = (
    <Card className={cn(
      "border-border/70 shadow-[var(--shadow-card)] transition-all h-full",
      to ? "hover:shadow-[var(--shadow-elevated)] hover:border-brand/40 active:scale-[0.98] cursor-pointer" : ""
    )}>
      <CardContent className="flex h-full items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          )}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            toneStyles[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-xl">
        {inner}
      </Link>
    );
  }

  return inner;
}
