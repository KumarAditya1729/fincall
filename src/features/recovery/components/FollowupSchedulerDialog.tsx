import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { toastError } from "@/lib/errors";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QUERY_KEYS } from "@/constants";
import { scheduleFollowup } from "@/features/recovery/services/recoveryService";
import { todayISO } from "@/lib/format";
import type { CurrentUser } from "@/types";

const schema = z.object({
  scheduledDate: z.string().min(1, "Pick a date"),
  scheduledTime: z.string().max(8).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  notes: z.string().trim().max(500).optional(),
});

interface FollowupSchedulerDialogProps {
  customerId: string;
  branchId: string | null;
  user: CurrentUser;
  trigger?: ReactNode;
}

/** Reusable scheduler used from the queue, today's calls and the customer profile. */
export function FollowupSchedulerDialog({
  customerId,
  branchId,
  user,
  trigger,
}: FollowupSchedulerDialogProps) {
  const [open, setOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(todayISO());
  const [scheduledTime, setScheduledTime] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({ scheduledDate, scheduledTime, priority, notes });
      await scheduleFollowup({
        customerId,
        branchId,
        assignedTo: user.id,
        scheduledDate: parsed.scheduledDate,
        scheduledTime: parsed.scheduledTime || null,
        priority: parsed.priority,
        notes: parsed.notes || null,
      });
    },
    onSuccess: async () => {
      toast.success("Follow-up scheduled");
      setOpen(false);
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customerDetail(customerId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todaysWork });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recoveryQueue });
    },
    onError: (error) => toastError(error, "Could not schedule the follow-up"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            Schedule follow-up
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
          <DialogDescription>Assign the next touchpoint for this borrower.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="followup-date">Date</Label>
              <Input
                id="followup-date"
                type="date"
                min={todayISO()}
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followup-time">Time</Label>
              <Input
                id="followup-time"
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="followup-priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as typeof priority)}
            >
              <SelectTrigger id="followup-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="followup-notes">Notes</Label>
            <Textarea
              id="followup-notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What should the next call cover?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={mutation.isPending || !scheduledDate}
            onClick={() => mutation.mutate()}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {mutation.isPending ? "Saving…" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
