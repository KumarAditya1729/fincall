import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity, Server } from "lucide-react";
import { fetchWorkers } from "../services/jobQueueService";

export function WorkerHealth() {
  const { data: workers, isLoading } = useQuery({
    queryKey: ["admin", "workers"],
    queryFn: fetchWorkers,
    refetchInterval: 10000, // Refresh every 10s
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 h-24 rounded-lg" />;
  }

  if (!workers || workers.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-lg flex items-center gap-3">
        <Server className="w-5 h-5" />
        <div>
          <p className="font-medium">No active workers found</p>
          <p className="text-sm">
            The background queue is currently offline. Please start a worker instance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-gray-500" />
        Worker Health
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workers.map((worker) => {
          const isAlive = worker.status === "alive";
          // Check if heartbeat is extremely old despite being 'alive' (e.g. killed abruptly)
          const lastHeartbeat = new Date(worker.last_heartbeat_at).getTime();
          const isStale = isAlive && Date.now() - lastHeartbeat > 120000;

          const activeStatus = !isAlive || isStale ? "offline" : "alive";

          return (
            <div key={worker.id} className="border rounded-md p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate" title={worker.hostname}>
                  {worker.hostname}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeStatus === "alive"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {activeStatus === "alive" ? "Alive" : "Offline"}
                </span>
              </div>
              <div className="text-sm text-gray-500">PID: {worker.pid}</div>
              <div className="text-xs text-gray-400">
                Last Heartbeat:{" "}
                {formatDistanceToNow(new Date(worker.last_heartbeat_at), { addSuffix: true })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
