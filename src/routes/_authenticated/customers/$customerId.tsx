import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, MessageSquare, PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { toastError } from "@/lib/errors";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RecoveryStatusBadge } from "@/components/common/RecoveryStatusBadge";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AUDIT_ACTIONS, FOLLOWUP_STATUS_LABELS, LOAN_STATUS_LABELS, QUERY_KEYS } from "@/constants";
import { recordAudit } from "@/features/audit/services/auditService";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { LogCallDialog } from "@/features/calls/components/LogCallDialog";
import { addRemark, completeFollowup } from "@/features/calls/services/callService";
import {
  fetchCustomerById,
  fetchCustomerCalls,
  fetchCustomerFollowups,
  fetchCustomerLoans,
  fetchCustomerRemarks,
} from "@/features/customers/services/customerDetailService";
import { BrokenPromiseDialog } from "@/features/recovery/components/BrokenPromiseDialog";
import { CallButton } from "@/features/recovery/components/CallButton";
import { CustomerTimeline } from "@/features/recovery/components/CustomerTimeline";
import { FollowupSchedulerDialog } from "@/features/recovery/components/FollowupSchedulerDialog";
import { RecordPaymentDialog } from "@/features/recovery/components/RecordPaymentDialog";
import { fetchCustomerTimeline } from "@/features/recovery/services/recoveryService";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer profile — Recovera" },
      {
        name: "description",
        content:
          "Borrower profile with loan exposure, call history, promise-to-pay tracking and follow-ups.",
      },
      { property: "og:title", content: "Customer profile — Recovera" },
      {
        property: "og:description",
        content: "Full recovery history for a single borrower account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerDetailPage,
  errorComponent: () => (
    <AppShell>
      <EmptyState
        icon={PhoneCall}
        title="Customer unavailable"
        description="This borrower doesn't exist, or your role doesn't allow access to it."
      />
    </AppShell>
  ),
});

function CustomerDetailPage() {
  const { customerId } = useParams({ from: "/_authenticated/customers/$customerId" });
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [remarkBody, setRemarkBody] = useState("");

  const customer = useQuery({
    queryKey: [...QUERY_KEYS.customerDetail(customerId), "profile"],
    queryFn: () => fetchCustomerById(customerId),
  });
  const loans = useQuery({
    queryKey: [...QUERY_KEYS.customerDetail(customerId), "loans"],
    queryFn: () => fetchCustomerLoans(customerId),
  });
  const calls = useQuery({
    queryKey: [...QUERY_KEYS.customerDetail(customerId), "calls"],
    queryFn: () => fetchCustomerCalls(customerId),
  });
  const followups = useQuery({
    queryKey: [...QUERY_KEYS.customerDetail(customerId), "followups"],
    queryFn: () => fetchCustomerFollowups(customerId),
  });
  const timeline = useQuery({
    queryKey: QUERY_KEYS.timeline(customerId),
    queryFn: () => fetchCustomerTimeline(customerId),
  });
  const remarks = useQuery({
    queryKey: [...QUERY_KEYS.customerDetail(customerId), "remarks"],
    queryFn: () => fetchCustomerRemarks(customerId),
  });

  useEffect(() => {
    if (user && customer.data) {
      void recordAudit({
        action: AUDIT_ACTIONS.CUSTOMER_VIEW,
        entityType: "customers",
        entityId: customerId,
        userId: user.id,
        branchId: user.branchId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, customer.data?.id]);

  const remarkMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      await addRemark({
        customerId,
        authorId: user.id,
        branchId: customer.data?.branch?.id ?? user.branchId,
        body: remarkBody.trim(),
      });
    },
    onSuccess: async () => {
      setRemarkBody("");
      toast.success("Remark added");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline(customerId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customerDetail(customerId) });
    },
    onError: (error) => toastError(error, "Could not save"),
  });

  const followupMutation = useMutation({
    mutationFn: completeFollowup,
    onSuccess: async () => {
      toast.success("Follow-up completed");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customerDetail(customerId) });
    },
    onError: (error) => toastError(error, "Could not update"),
  });

  const totalOutstanding = (loans.data ?? []).reduce(
    (sum, loan) => sum + Number(loan.outstanding_amount ?? 0),
    0,
  );
  const totalOverdue = (loans.data ?? []).reduce(
    (sum, loan) => sum + Number(loan.overdue_amount ?? 0),
    0,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to customers
        </Link>

        {customer.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : customer.data ? (
          <>
            <PageHeader
              title={customer.data.full_name}
              description={`${customer.data.customer_code} · ${customer.data.phone} · ${customer.data.branch?.name ?? "No branch"}`}
              actions={
                user ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <RecoveryStatusBadge status={customer.data.recovery_status} />
                    <CallButton phone={customer.data.phone} label="Call" />
                    <LogCallDialog
                      customerId={customerId}
                      branchId={customer.data.branch?.id ?? user.branchId}
                      user={user}
                      loanId={loans.data?.[0]?.id ?? null}
                    />
                    <FollowupSchedulerDialog
                      customerId={customerId}
                      branchId={customer.data.branch?.id ?? user.branchId}
                      user={user}
                    />
                    <RecordPaymentDialog
                      customerId={customerId}
                      branchId={customer.data.branch?.id ?? user.branchId}
                      user={user}
                    />
                    {customer.data.recovery_status === "ptp" ? (
                      <BrokenPromiseDialog customerId={customerId} />
                    ) : null}
                  </div>
                ) : null
              }
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryTile label="Outstanding" value={formatCurrency(totalOutstanding)} />
              <SummaryTile label="Overdue" value={formatCurrency(totalOverdue)} />
              <SummaryTile
                label="Assigned to"
                value={customer.data.assignee?.full_name ?? "Unassigned"}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Loans</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loans.isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (loans.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No loans recorded.</p>
                  ) : (
                    (loans.data ?? []).map((loan) => (
                      <div
                        key={loan.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {loan.loan_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            EMI {formatCurrency(loan.emi_amount)} · {loan.days_past_due} DPD
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium tabular-nums text-foreground">
                            {formatCurrency(loan.outstanding_amount)}
                          </p>
                          <Badge variant="secondary" className="border-0 text-xs">
                            {LOAN_STATUS_LABELS[loan.status]}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Follow-ups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {followups.isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (followups.data ?? []).length === 0 ? (
                    <EmptyState
                      icon={CalendarClock}
                      title="No follow-ups"
                      description="Schedule one while logging a call."
                    />
                  ) : (
                    (followups.data ?? []).map((followup) => (
                      <div
                        key={followup.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(followup.scheduled_date)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {FOLLOWUP_STATUS_LABELS[followup.status]} · {followup.priority}
                          </p>
                        </div>
                        {followup.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={followupMutation.isPending}
                            onClick={() =>
                              followupMutation.mutate({
                                followupId: followup.id,
                                userId: user!.id,
                                branchId: customer.data?.branch_id ?? null,
                              })
                            }
                          >
                            Complete
                          </Button>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Activity timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerTimeline events={timeline.data ?? []} isLoading={timeline.isLoading} />
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Call history</CardTitle>
              </CardHeader>
              <CardContent>
                {calls.isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (calls.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={PhoneCall}
                    title="No calls logged"
                    description="Use “Log call” to record your first conversation."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {(calls.data ?? []).map((call) => (
                      <li key={call.id} className="space-y-1 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              call.is_connected
                                ? "border-0 bg-success/15 text-success"
                                : "border-0 bg-muted text-muted-foreground"
                            }
                          >
                            {call.status?.name ??
                              (call.is_connected ? "Connected" : "Not connected")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(call.called_at)} · {call.duration_seconds}s ·{" "}
                            {call.caller?.full_name ?? "—"}
                          </span>
                          {call.ptp_amount ? (
                            <Badge
                              variant="secondary"
                              className="border-0 bg-warning/15 text-warning"
                            >
                              PTP {formatCurrency(call.ptp_amount)} · {formatDate(call.ptp_date)}
                            </Badge>
                          ) : null}
                        </div>
                        {call.remark ? (
                          <p className="text-sm text-foreground">{call.remark}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Remarks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    maxLength={500}
                    value={remarkBody}
                    onChange={(event) => setRemarkBody(event.target.value)}
                    placeholder="Add an internal note about this borrower"
                    aria-label="New remark"
                  />
                  <Button
                    size="sm"
                    disabled={remarkBody.trim().length < 3 || remarkMutation.isPending}
                    onClick={() => remarkMutation.mutate()}
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                  >
                    {remarkMutation.isPending ? "Saving…" : "Add remark"}
                  </Button>
                </div>
                {(remarks.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No remarks yet"
                    description="Notes added here are visible to your recovery team."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {(remarks.data ?? []).map((remark) => (
                      <li key={remark.id} className="py-3">
                        <p className="text-sm text-foreground">{remark.body}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {remark.author?.full_name ?? "Unknown"} ·{" "}
                          {formatDateTime(remark.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
