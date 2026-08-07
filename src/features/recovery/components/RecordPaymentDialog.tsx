import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { AUDIT_ACTIONS, QUERY_KEYS } from "@/constants";
import { recordAudit } from "@/features/audit/services/auditService";
import { fetchCustomerLoans } from "@/features/customers/services/customerDetailService";
import { recordPayment } from "@/features/recovery/services/recoveryService";
import { formatCurrency, todayISO } from "@/lib/format";
import type { CurrentUser } from "@/types";

const schema = z.object({
  loanId: z.string().min(1, "Select a loan"),
  amount: z.coerce.number().positive("Enter an amount greater than zero").max(100000000),
  paidOn: z.string().min(1),
  mode: z.string().min(1),
  referenceNo: z.string().trim().max(60).optional(),
});

interface RecordPaymentDialogProps {
  customerId: string;
  branchId: string | null;
  user: CurrentUser;
  trigger?: ReactNode;
}

/** Captures a collection against a loan and updates the borrower's recovery status. */
export function RecordPaymentDialog({
  customerId,
  branchId,
  user,
  trigger,
}: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(todayISO());
  const [mode, setMode] = useState("cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [markPaid, setMarkPaid] = useState(false);
  const queryClient = useQueryClient();

  const loans = useQuery({
    queryKey: [...QUERY_KEYS.customerDetail(customerId), "loans"],
    queryFn: () => fetchCustomerLoans(customerId),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({ loanId, amount, paidOn, mode, referenceNo });
      const paymentId = await recordPayment({
        loanId: parsed.loanId,
        customerId,
        branchId,
        amount: parsed.amount,
        paidOn: parsed.paidOn,
        mode: parsed.mode,
        referenceNo: parsed.referenceNo || null,
        collectedBy: user.id,
        markPaid,
      });
      await recordAudit({
        action: "payment.create",
        entityType: "payments",
        entityId: paymentId,
        userId: user.id,
        branchId,
        metadata: { customerId, amount: parsed.amount },
      });
    },
    onSuccess: async () => {
      toast.success("Payment recorded");
      setOpen(false);
      setAmount("");
      setReferenceNo("");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customerDetail(customerId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recoveryQueue });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executiveDashboard });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branchPerformance });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.callTrend });
    },
    onError: (error) => toastError(error, "Could not record the payment"),
  });

  const noLoans = loans.isSuccess && (loans.data ?? []).length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            Payment received
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment received</DialogTitle>
          <DialogDescription>
            Log a collection — the loan balance and recovery status update automatically.
          </DialogDescription>
        </DialogHeader>

        {noLoans ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            This borrower has no active loans to collect against.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-loan">Loan</Label>
              <Select value={loanId} onValueChange={setLoanId}>
                <SelectTrigger id="payment-loan">
                  <SelectValue placeholder="Select loan" />
                </SelectTrigger>
                <SelectContent>
                  {(loans.data ?? []).map((loan) => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.loan_number} · {formatCurrency(loan.outstanding_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount (₹)</Label>
                <Input
                  id="payment-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.slice(0, 12))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-date">Paid on</Label>
                <Input
                  id="payment-date"
                  type="date"
                  max={todayISO()}
                  value={paidOn}
                  onChange={(event) => setPaidOn(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-mode">Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger id="payment-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-ref">Reference no.</Label>
                <Input
                  id="payment-ref"
                  value={referenceNo}
                  onChange={(event) => setReferenceNo(event.target.value.slice(0, 60))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="payment-full" className="text-sm">
                  Loan fully settled
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marks the borrower as Paid instead of Partially Paid.
                </p>
              </div>
              <Switch id="payment-full" checked={markPaid} onCheckedChange={setMarkPaid} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={mutation.isPending || noLoans}
            onClick={() => mutation.mutate()}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {mutation.isPending ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
