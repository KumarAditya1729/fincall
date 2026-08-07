import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AUDIT_ACTIONS, QUERY_KEYS, RECOVERY_STATUS_LABELS } from "@/constants";
import { recordAudit } from "@/features/audit/services/auditService";
import { logCall } from "@/features/calls/services/callService";
import { fetchCallStatuses } from "@/features/customers/services/customerDetailService";
import { CALL_PURPOSES } from "@/constants";
import type { CurrentUser, RecoveryStatus } from "@/types";

const logCallSchema = z.object({
  purpose: z.string().min(1, "Select a purpose"),
  callStatusId: z.string().min(1, "Select a call outcome"),
  durationSeconds: z.coerce.number().int().min(0).max(7200),
  talkedWith: z.string().trim().max(100).optional(),
  remark: z.string().trim().max(500).optional(),
  ptpAmount: z.string().trim().max(12).optional(),
  ptpDate: z.string().optional(),
  nextFollowupDate: z.string().optional(),
  recoveryStatus: z.string().optional(),
});

type LogCallValues = z.input<typeof logCallSchema>;

interface LogCallDialogProps {
  customerId: string;
  branchId: string | null;
  user: CurrentUser;
  loanId?: string | null;
}

export function LogCallDialog({ customerId, branchId, user, loanId }: LogCallDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const statuses = useQuery({
    queryKey: QUERY_KEYS.callStatuses,
    queryFn: fetchCallStatuses,
    enabled: open,
  });

  const form = useForm<LogCallValues>({
    resolver: zodResolver(logCallSchema),
    defaultValues: {
      purpose: "recovery_followup",
      callStatusId: "",
      durationSeconds: 0,
      talkedWith: "",
      remark: "",
      ptpAmount: "",
      ptpDate: "",
      nextFollowupDate: "",
      recoveryStatus: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LogCallValues) => {
      const parsed = logCallSchema.parse(values);
      const status = (statuses.data ?? []).find((item) => item.id === parsed.callStatusId);
      const callId = await logCall({
        customerId,
        loanId: loanId ?? null,
        branchId,
        calledBy: user.id,
        callStatusId: parsed.callStatusId,
        purpose: parsed.purpose,
        isConnected: status?.is_connected ?? false,
        durationSeconds: parsed.durationSeconds,
        talkedWith: parsed.talkedWith || null,
        remark: parsed.remark || null,
        ptpAmount: parsed.ptpAmount ? Number(parsed.ptpAmount) : null,
        ptpDate: parsed.ptpDate || null,
        nextFollowupDate: parsed.nextFollowupDate || null,
        recoveryStatus: (parsed.recoveryStatus as RecoveryStatus) || null,
      });
      await recordAudit({
        action: AUDIT_ACTIONS.CALL_UPDATE,
        entityType: "call_logs",
        entityId: callId,
        userId: user.id,
        branchId,
        metadata: { customerId },
      });
    },
    onSuccess: async () => {
      toast.success("Call logged");
      setOpen(false);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customerDetail(customerId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.calls });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executiveDashboard });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branchPerformance });
    },
    onError: (error) => {
      toastError(error, "Could not log the call");
    },
  });

  const noStatuses = statuses.isSuccess && (statuses.data ?? []).length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Log call</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a call</DialogTitle>
          <DialogDescription>
            Capture the outcome, promise-to-pay and next follow-up for this borrower.
          </DialogDescription>
        </DialogHeader>

        {noStatuses ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            No call outcomes are configured yet. A Super Admin needs to add call statuses before
            calls can be logged.
          </p>
        ) : (
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            >
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CALL_PURPOSES.map((purpose) => (
                          <SelectItem key={purpose.value} value={purpose.value}>
                            {purpose.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="callStatusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call outcome</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(statuses.data ?? []).map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="durationSeconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={7200} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="talkedWith"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talked with</FormLabel>
                      <FormControl>
                        <Input placeholder="Borrower / spouse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ptpAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PTP amount (₹)</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ptpDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PTP date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nextFollowupDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next follow-up</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recoveryStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Update status</FormLabel>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Leave unchanged" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(RECOVERY_STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remark</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        maxLength={500}
                        placeholder="What happened on the call?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {mutation.isPending ? "Saving…" : "Save call"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
