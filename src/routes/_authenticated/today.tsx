import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, PhoneCall, PhoneOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { toastError } from "@/lib/errors";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QUERY_KEYS } from "@/constants";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { LogCallDialog } from "@/features/calls/components/LogCallDialog";
import { completeFollowup } from "@/features/calls/services/callService";
import { CallButton } from "@/features/recovery/components/CallButton";
import { FollowupSchedulerDialog } from "@/features/recovery/components/FollowupSchedulerDialog";
import { fetchTodaysWork, type TodayFollowup } from "@/features/recovery/services/recoveryService";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({
    meta: [
      { title: "Today's calls — Recovera" },
      {
        name: "description",
        content:
          "Your call plan for today: due and overdue follow-ups, click-to-call and outcomes logged in one place.",
      },
      { property: "og:title", content: "Today's calls — Recovera" },
      {
        property: "og:description",
        content: "Daily recovery worklist with follow-ups due and calls already made.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { data: user } = useCurrentUser();
  const [onlyMine, setOnlyMine] = useState(true);
  const queryClient = useQueryClient();
  const isManagerial =
    user?.primaryRole === "branch_manager" || user?.primaryRole === "super_admin";

  const effectiveOnlyMine = isManagerial ? false : onlyMine;

  const work = useQuery({
    queryKey: [...QUERY_KEYS.todaysWork, effectiveOnlyMine, user?.id],
    queryFn: () => fetchTodaysWork({ onlyMine: effectiveOnlyMine, userId: user!.id }),
    enabled: Boolean(user?.id),
  });

  const complete = useMutation({
    mutationFn: completeFollowup,
    onSuccess: async () => {
      toast.success("Follow-up completed");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todaysWork });
    },
    onError: (error) => toastError(error, "Could not update"),
  });

  const data = work.data;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Today's calls"
          description="Follow-ups due today, overdue promises and every call you've logged so far."
          actions={
            <div className="flex items-center gap-2">
            {!isManagerial ? (
              <>
                <Label htmlFor="only-mine" className="text-sm text-muted-foreground">
                  Only mine
                </Label>
                <Switch id="only-mine" checked={onlyMine} onCheckedChange={setOnlyMine} />
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                Showing all today’s calls for your role.
              </span>
            )}
          </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Due today"
            value={String(data?.dueFollowups.length ?? 0)}
            icon={CalendarClock}
            tone="brand"
          />
          <StatCard
            label="Overdue follow-ups"
            value={String(data?.overdueFollowups.length ?? 0)}
            icon={PhoneOff}
            tone="danger"
          />
          <StatCard
            label="Calls made"
            value={String(data?.calls.length ?? 0)}
            icon={PhoneCall}
            tone="brand"
          />
          <StatCard
            label="Connected"
            value={String(data?.connectedCount ?? 0)}
            icon={CheckCircle2}
            tone="success"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FollowupList
            title="Due today"
            followups={data?.dueFollowups ?? []}
            isLoading={work.isLoading}
            onComplete={(id) =>
              complete.mutate({
                followupId: id,
                userId: user!.id,
                branchId: user?.branchId ?? null,
              })
            }
            userId={user?.id ?? null}
            branchId={user?.branchId ?? null}
          />
          <FollowupList
            title="Overdue"
            followups={data?.overdueFollowups ?? []}
            isLoading={work.isLoading}
            onComplete={(id) =>
              complete.mutate({
                followupId: id,
                userId: user!.id,
                branchId: user?.branchId ?? null,
              })
            }
            userId={user?.id ?? null}
            branchId={user?.branchId ?? null}
            tone="danger"
          />
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Calls logged today</CardTitle>
          </CardHeader>
          <CardContent>
            {work.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (data?.calls ?? []).length === 0 ? (
              <EmptyState
                icon={PhoneCall}
                title="No calls yet today"
                description="Start from the queue or a follow-up above."
              />
            ) : (
              <ul className="divide-y divide-border">
                {(data?.calls ?? []).map((call) => (
                  <li key={call.id} className="flex flex-wrap items-center gap-2 py-3">
                    {call.customer ? (
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: call.customer.id }}
                        className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                      >
                        {call.customer.full_name}
                      </Link>
                    ) : (
                      <span className="text-sm">Unknown</span>
                    )}
                    <Badge
                      variant="secondary"
                      className={
                        call.is_connected
                          ? "border-0 bg-success/15 text-success"
                          : "border-0 bg-muted text-muted-foreground"
                      }
                    >
                      {call.status?.name ?? (call.is_connected ? "Connected" : "Not connected")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(call.called_at)}
                      {call.purpose ? ` · ${call.purpose.replace(/_/g, " ")}` : ""}
                    </span>
                    {call.remark ? (
                      <span className="w-full text-sm text-muted-foreground">{call.remark}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function FollowupList({
  title,
  followups,
  isLoading,
  onComplete,
  userId,
  branchId,
  tone = "brand",
}: {
  title: string;
  followups: TodayFollowup[];
  isLoading: boolean;
  onComplete: (id: string) => void;
  userId: string | null;
  branchId: string | null;
  tone?: "brand" | "danger";
}) {
  const { data: user } = useCurrentUser();

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : followups.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={`Nothing ${title.toLowerCase()}`}
            description="Schedule follow-ups while logging calls to fill this list."
          />
        ) : (
          followups.map((followup) => (
            <div key={followup.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                {followup.customer ? (
                  <Link
                    to="/customers/$customerId"
                    params={{ customerId: followup.customer.id }}
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
                    {followup.customer.full_name}
                  </Link>
                ) : (
                  <span className="text-sm">Unknown borrower</span>
                )}
                <Badge
                  variant="secondary"
                  className={
                    tone === "danger"
                      ? "border-0 bg-danger/15 text-danger"
                      : "border-0 bg-brand/10 text-brand"
                  }
                >
                  {followup.scheduled_date}
                  {followup.scheduled_time ? ` ${followup.scheduled_time.slice(0, 5)}` : ""}
                </Badge>
                <Badge variant="secondary" className="border-0 text-xs capitalize">
                  {followup.priority}
                </Badge>
              </div>
              {followup.notes ? (
                <p className="text-sm text-muted-foreground">{followup.notes}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-1.5">
                <CallButton
                  phone={followup.customer?.phone ?? null}
                  afterCallClose={() => {
                    if (followup.customer) {
                      window.location.href = `/customers/${followup.customer.id}`;
                    }
                  }}
                />
                {user && followup.customer ? (
                  <>
                    <LogCallDialog
                      customerId={followup.customer.id}
                      branchId={branchId}
                      user={user}
                    />
                    <FollowupSchedulerDialog
                      customerId={followup.customer.id}
                      branchId={branchId}
                      user={user}
                    />
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!userId}
                  onClick={() => onComplete(followup.id)}
                >
                  Mark done
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
