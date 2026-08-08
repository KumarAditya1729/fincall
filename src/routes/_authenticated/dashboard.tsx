import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BadgeIndianRupee,
  CalendarClock,
  CheckCircle2,
  MapPin,
  PhoneCall,
  PhoneOutgoing,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, ROLE_LABELS } from "@/constants";
import { fetchRecentActivity } from "@/features/audit/services/auditService";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  fetchAdminMetrics,
  fetchBranchPerformance,
  fetchCallTrend,
  fetchExecutiveMetrics,
} from "@/features/dashboard/services/dashboardService";
import { useDashboardRealtime } from "@/features/dashboard/hooks/useDashboardRealtime";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/format";
import type { CurrentUser } from "@/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Recovery Dashboard — Recovera" },
      {
        name: "description",
        content:
          "Monitor collections, call activity, follow-ups and branch recovery performance in real time.",
      },
      { property: "og:title", content: "Recovery Dashboard — Recovera" },
      {
        property: "og:description",
        content: "Live portfolio, calling and collection metrics for your microfinance branches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();
  const role = user?.primaryRole ?? null;
  const isManagerial = role === "super_admin" || role === "branch_manager";

  useDashboardRealtime();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={`Welcome back, ${user?.profile?.full_name?.split(" ")[0] ?? "there"}`}
          description={
            role
              ? `${ROLE_LABELS[role]}${user?.branch?.name ? ` · ${user.branch.name}` : ""} · ${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}`
              : "Your account has no role assigned yet. Contact your administrator."
          }
          actions={
            role ? (
              <>
                <Button asChild variant="outline">
                  <Link to="/today">
                    <CalendarClock className="size-4" aria-hidden="true" />
                    Today's calls
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/recovery">
                    <Target className="size-4" aria-hidden="true" />
                    Open recovery queue
                  </Link>
                </Button>
              </>
            ) : null
          }
        />
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : isManagerial ? (
          <ManagerialDashboard
            branchId={role === "branch_manager" ? (user?.branchId ?? null) : null}
          />
        ) : role === "recovery_executive" && user ? (
          <ExecutiveDashboard user={user} />
        ) : (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Users}
                title="No role assigned"
                description="Ask a Super Admin to assign you a branch and role to see your workspace."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function ManagerialDashboard({ branchId }: { branchId: string | null }) {
  const metrics = useQuery({
    queryKey: [...QUERY_KEYS.adminDashboard, branchId],
    queryFn: () => fetchAdminMetrics(branchId),
  });
  const branches = useQuery({
    queryKey: QUERY_KEYS.branchPerformance,
    queryFn: fetchBranchPerformance,
  });
  const trend = useQuery({ queryKey: QUERY_KEYS.callTrend, queryFn: () => fetchCallTrend(7) });

  const data = metrics.data;
  const loading = metrics.isLoading;

  return (
    <div className="space-y-6">
      <section aria-label="Portfolio overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total customers"
          value={String(data?.totalCustomers ?? 0)}
          icon={Users}
          isLoading={loading}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(data?.outstandingAmount ?? 0)}
          icon={Wallet}
          tone="warning"
          isLoading={loading}
        />
        <StatCard
          label="Today's collection"
          value={formatCurrency(data?.todaysCollection ?? 0)}
          icon={BadgeIndianRupee}
          tone="success"
          isLoading={loading}
        />
        <StatCard
          label="Recovery rate"
          value={formatPercent(data?.recoveryRate ?? 0)}
          icon={TrendingUp}
          tone="brand"
          isLoading={loading}
        />
      </section>

      <section aria-label="Call activity" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Calls today"
          value={String(data?.todaysCalls ?? 0)}
          icon={PhoneCall}
          tone="neutral"
          isLoading={loading}
        />
        <StatCard
          label="Connected"
          value={String(data?.connectedCalls ?? 0)}
          icon={CheckCircle2}
          tone="success"
          isLoading={loading}
        />
        <StatCard
          label="Pending outreach"
          value={String(data?.pendingCalls ?? 0)}
          icon={PhoneOutgoing}
          tone="danger"
          isLoading={loading}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Last 7 days activity</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <TrendChart points={trend.data ?? []} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Branch performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {branches.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (branches.data ?? []).length === 0 ? (
              <EmptyState
                icon={Users}
                title="No branches yet"
                description="Add branches to compare recovery performance across locations."
              />
            ) : (
              (branches.data ?? []).map((branch) => (
                <div key={branch.branchId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{branch.branchName}</span>
                    <span className="text-muted-foreground">
                      {branch.customers} customers · {formatCurrency(branch.collection)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(branch.recoveryRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <RecentActivityCard />
    </div>
  );
}

function ExecutiveDashboard({ user }: { user: CurrentUser }) {
  const metrics = useQuery({
    queryKey: [...QUERY_KEYS.executiveDashboard, user.id, user.branchId],
    queryFn: () => fetchExecutiveMetrics(user.id, user.branchId),
  });
  const data = metrics.data;
  const loading = metrics.isLoading;

  return (
    <div className="space-y-6">
      <section aria-label="My workload" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Branch"
          value={user.branch?.name ?? "Unassigned"}
          icon={MapPin}
          isLoading={false}
        />
        <StatCard
          label="Assigned customers"
          value={String(data?.assignedCustomers ?? 0)}
          icon={Users}
          isLoading={loading}
        />
        <StatCard
          label="Calls today"
          value={String(data?.todaysCalls ?? 0)}
          icon={PhoneCall}
          tone="neutral"
          isLoading={loading}
        />
        <StatCard
          label="Connected calls"
          value={String(data?.completedCalls ?? 0)}
          icon={CheckCircle2}
          tone="success"
          isLoading={loading}
        />
        <StatCard
          label="Follow-ups due"
          value={String(data?.pendingFollowups ?? 0)}
          icon={CalendarClock}
          tone="warning"
          hint={`${data?.nextFollowups ?? 0} scheduled later`}
          isLoading={loading}
        />
      </section>
      <RecentActivityCard />
    </div>
  );
}

function RecentActivityCard() {
  const activity = useQuery({
    queryKey: QUERY_KEYS.recentActivity,
    queryFn: () => fetchRecentActivity(8),
  });

  const renderActivityLabel = (item: any) => {
    const metadata = item.metadata as { customerId?: string; body?: string; remark?: string; isConnected?: boolean } | null;

    if (item.activity === "remark.create") {
      return metadata?.body ? `Remark added: ${metadata.body}` : "Remark added";
    }

    if (item.activity === "call.update") {
      if (metadata?.remark) {
        return `Call logged: ${metadata.remark}`;
      }
      return metadata?.isConnected ? "Connected call logged" : "Call logged";
    }

    return item.activity.replace(/\./g, " ");
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (activity.data ?? []).length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Nothing here yet"
            description="Logins, customer updates and call outcomes will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {(activity.data ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <span className="truncate text-sm font-medium text-foreground">
                  {renderActivityLabel(item)}
                  {item.entity_type ? (
                    <span className="ml-2 text-muted-foreground">{item.entity_type}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TrendChart({
  points,
}: {
  points: { label: string; calls: number; collection: number }[];
}) {
  const max = Math.max(...points.map((point) => point.calls), 1);
  return (
    <div className="flex h-40 items-end gap-3" role="img" aria-label="Calls over the last 7 days">
      {points.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-brand/80"
              style={{ height: `${Math.max((point.calls / max) * 100, 3)}%` }}
              title={`${point.calls} calls`}
            />
          </div>
          <span className="text-xs text-muted-foreground">{point.label}</span>
        </div>
      ))}
    </div>
  );
}
