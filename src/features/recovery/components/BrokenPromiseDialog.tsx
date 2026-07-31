import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { toastError } from "@/lib/errors";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUERY_KEYS } from "@/constants";
import { markBrokenPromise } from "@/features/recovery/services/recoveryService";

interface BrokenPromiseDialogProps {
  customerId: string;
  trigger?: ReactNode;
}

/**
 * Flags a missed promise-to-pay. The remark, the status change and the audit entry are
 * written together by the database, so the UI only supplies the reason.
 */
export function BrokenPromiseDialog({ customerId, trigger }: BrokenPromiseDialogProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmed = note.trim();
      if (trimmed.length < 3) throw new Error("Add a short reason (min 3 characters)");
      await markBrokenPromise({ customerId, note: trimmed });
    },
    onSuccess: async () => {
      toast.success("Broken promise recorded");
      setOpen(false);
      setNote("");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customerDetail(customerId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recoveryQueue });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
    },
    onError: (error) => toastError(error, "Could not update the borrower"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            Broken promise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark promise as broken</DialogTitle>
          <DialogDescription>
            The borrower moves back to In Progress and the reason is added to the timeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="broken-note">Reason</Label>
          <Textarea
            id="broken-note"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="PTP date passed without payment"
          />
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={mutation.isPending || note.trim().length < 3}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving…" : "Mark broken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
