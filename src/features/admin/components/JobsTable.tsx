import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Play, Pause, Trash2, RefreshCcw, Archive } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  fetchJobs,
  retryJob,
  cancelJob,
  retryAllFailed,
  purgeQueue,
  pauseQueue,
  resumeQueue,
  type Job,
} from "../services/jobQueueService";
import type { PaginationState } from "@/types";

export function JobsTable() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "jobs", pagination, statusFilter],
    queryFn: () => fetchJobs(pagination, { status: statusFilter }),
    refetchInterval: 5000,
  });

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "queued":
        return <Badge variant="secondary">Queued</Badge>;
      case "running":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Running</Badge>;
      case "retrying":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Retrying</Badge>;
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      case "dead_letter":
        return <Badge variant="destructive">Dead Letter</Badge>;
      case "archived":
        return (
          <Badge variant="outline" className="opacity-50">
            Archived
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="secondary" className="opacity-75">
            Paused
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: Job["priority"]) => {
    switch (priority) {
      case "critical":
        return (
          <Badge variant="destructive" className="scale-90">
            Critical
          </Badge>
        );
      case "high":
        return <Badge className="bg-orange-500 hover:bg-orange-600 scale-90">High</Badge>;
      case "medium":
        return (
          <Badge variant="secondary" className="scale-90">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="scale-90">
            Low
          </Badge>
        );
    }
  };

  const handleAction = async (action: string, promise: Promise<void>) => {
    toast.promise(promise, {
      loading: `${action}...`,
      success: () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
        return `${action} successful`;
      },
      error: (err) => `Failed: ${err.message}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="retrying">Retrying</option>
            <option value="dead_letter">Dead Letter</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("Pause Queue", pauseQueue())}
          >
            <Pause className="w-4 h-4 mr-2" /> Pause Queue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("Resume Queue", resumeQueue())}
          >
            <Play className="w-4 h-4 mr-2" /> Resume Queue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("Retry All Failed", retryAllFailed())}
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Retry All Failed
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleAction("Purge Queue", purgeQueue())}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Purge Completed
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Type & ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="text-sm text-gray-400">Loading jobs...</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : data?.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No jobs found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              data?.rows.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="font-medium">{job.type}</div>
                    <div className="text-xs text-gray-500 truncate w-32" title={job.id}>
                      {job.id}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                  <TableCell className="w-[150px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                      {job.error_message && (
                        <span
                          className="text-[10px] text-red-500 truncate block w-[150px]"
                          title={job.error_message}
                        >
                          {job.error_message}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    <div>
                      Created: {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </div>
                    {job.started_at && (
                      <div>Started: {format(new Date(job.started_at), "HH:mm:ss")}</div>
                    )}
                    {job.finished_at && (
                      <div>Finished: {format(new Date(job.finished_at), "HH:mm:ss")}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {job.attempts} / {job.max_attempts}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {job.status === "dead_letter" && (
                          <DropdownMenuItem
                            onClick={() => handleAction("Retry Job", retryJob(job.id))}
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Requeue Job
                          </DropdownMenuItem>
                        )}
                        {(job.status === "queued" ||
                          job.status === "retrying" ||
                          job.status === "paused") && (
                          <DropdownMenuItem
                            onClick={() => handleAction("Cancel Job", cancelJob(job.id))}
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            Cancel Job
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
