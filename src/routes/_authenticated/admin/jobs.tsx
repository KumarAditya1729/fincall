import { createFileRoute } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { JobsTable } from "@/features/admin/components/JobsTable";
import { WorkerHealth } from "@/features/admin/components/WorkerHealth";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  component: JobsPage,
});

function JobsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Server className="h-8 w-8 text-primary" />
          Background Jobs
        </h2>
      </div>

      <p className="text-muted-foreground mb-4">
        Manage and monitor the enterprise background processing platform.
      </p>

      <WorkerHealth />

      <div className="mt-8">
        <JobsTable />
      </div>
    </div>
  );
}
