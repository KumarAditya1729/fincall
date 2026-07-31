import { createFileRoute } from "@tanstack/react-router";
import { CommunicationDashboard } from "../../../features/admin/components/Communication/CommunicationDashboard";

export const Route = createFileRoute("/_authenticated/admin/communication")({
  component: CommunicationRoute,
});

function CommunicationRoute() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Communication Platform
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage notifications, campaigns, templates, and providers.
          </p>
        </div>
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        <CommunicationDashboard />
      </div>
    </div>
  );
}
