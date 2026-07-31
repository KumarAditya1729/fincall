import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  branchSchema,
  createBranch,
  updateBranch,
  type BranchInput,
} from "@/features/admin/services/branchService";
import { toastError } from "@/lib/errors";
import type { Branch } from "@/types";

const EMPTY: BranchInput = {
  name: "",
  code: "",
  city: "",
  state: "",
  phone: "",
  is_active: true,
};

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onSaved: () => Promise<void> | void;
}

export function BranchFormDialog({ open, onOpenChange, branch, onSaved }: BranchFormDialogProps) {
  const [values, setValues] = useState<BranchInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      branch
        ? {
            name: branch.name,
            code: branch.code,
            city: branch.city ?? "",
            state: branch.state ?? "",
            phone: branch.phone ?? "",
            is_active: branch.is_active,
          }
        : EMPTY,
    );
  }, [open, branch]);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = branchSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
        throw new Error("Fix the highlighted fields and try again.");
      }
      setErrors({});
      if (branch) await updateBranch(branch.id, parsed.data);
      else await createBranch(parsed.data);
    },
    onSuccess: async () => {
      toast.success(branch ? "Branch updated" : "Branch created");
      onOpenChange(false);
      await onSaved();
    },
    onError: (error) => toastError(error, "Could not save the branch"),
  });

  function field(key: keyof BranchInput, label: string, props: Record<string, unknown> = {}) {
    const id = `branch-${key}`;
    const message = errors[key];
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={String(values[key] ?? "")}
          onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-error` : undefined}
          {...props}
        />
        {message ? (
          <p id={`${id}-error`} className="text-xs text-danger">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{branch ? "Edit branch" : "New branch"}</DialogTitle>
          <DialogDescription>
            Branch details drive access control, so keep codes unique and accurate.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "Branch name", { maxLength: 120, required: true })}
            {field("code", "Branch code", { maxLength: 20, required: true })}
            {field("city", "City", { maxLength: 80 })}
            {field("state", "State", { maxLength: 80 })}
            {field("phone", "Phone", { maxLength: 20, inputMode: "tel" })}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="branch-active" className="text-sm font-medium">
              Active for new allocations
            </Label>
            <Switch
              id="branch-active"
              checked={values.is_active}
              onCheckedChange={(checked) =>
                setValues((current) => ({ ...current, is_active: checked }))
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : branch ? "Save changes" : "Create branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
