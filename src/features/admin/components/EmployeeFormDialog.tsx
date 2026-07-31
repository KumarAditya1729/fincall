import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QUERY_KEYS, ROLE_LABELS, ROLE_PRIORITY } from "@/constants";
import {
  employeeSchema,
  setEmployeeRoles,
  updateEmployee,
  type EmployeeInput,
  type EmployeeRow,
} from "@/features/admin/services/employeeService";
import { fetchBranches } from "@/features/customers/services/customerService";
import { toastError } from "@/lib/errors";
import type { AppRole } from "@/types";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRow | null;
  onSaved: () => Promise<void> | void;
}

/**
 * Edits an employee profile and their roles. Roles are saved through a database
 * routine that re-checks the caller and refuses to leave the platform without a
 * super admin.
 */
export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSaved,
}: EmployeeFormDialogProps) {
  const [values, setValues] = useState<EmployeeInput | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const branches = useQuery({ queryKey: QUERY_KEYS.branches, queryFn: fetchBranches, enabled: open });

  useEffect(() => {
    if (!open || !employee) return;
    setErrors({});
    setRoles(employee.roles);
    setValues({
      full_name: employee.full_name,
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      employee_code: employee.employee_code ?? "",
      branch_id: employee.branch_id,
      is_active: employee.is_active,
    });
  }, [open, employee]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!employee || !values) throw new Error("No employee selected");
      const parsed = employeeSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
        throw new Error("Fix the highlighted fields and try again.");
      }
      if (roles.length === 0) throw new Error("Select at least one role.");
      setErrors({});

      await updateEmployee(employee.id, parsed.data);
      const changed =
        roles.length !== employee.roles.length ||
        roles.some((role) => !employee.roles.includes(role));
      if (changed) await setEmployeeRoles(employee.id, roles);
    },
    onSuccess: async () => {
      toast.success("Employee updated");
      onOpenChange(false);
      await onSaved();
    },
    onError: (error) => toastError(error, "Could not update the employee"),
  });

  if (!values) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
            <DialogDescription>Select an employee to edit.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription>
            Branch and role decide which borrowers this person can see and act on.
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
            <div className="space-y-1.5">
              <Label htmlFor="employee-name">Full name</Label>
              <Input
                id="employee-name"
                value={values.full_name}
                maxLength={120}
                onChange={(event) =>
                  setValues({ ...values, full_name: event.target.value })
                }
                aria-invalid={errors["full_name"] ? true : undefined}
              />
              {errors["full_name"] ? (
                <p className="text-xs text-danger">{errors["full_name"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee-code">Employee code</Label>
              <Input
                id="employee-code"
                value={values.employee_code ?? ""}
                maxLength={30}
                onChange={(event) => setValues({ ...values, employee_code: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee-email">Email</Label>
              <Input
                id="employee-email"
                type="email"
                value={values.email ?? ""}
                maxLength={255}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
                aria-invalid={errors["email"] ? true : undefined}
              />
              {errors["email"] ? <p className="text-xs text-danger">{errors["email"]}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee-phone">Phone</Label>
              <Input
                id="employee-phone"
                inputMode="tel"
                value={values.phone ?? ""}
                maxLength={20}
                onChange={(event) => setValues({ ...values, phone: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employee-branch">Branch</Label>
            <Select
              value={values.branch_id ?? "none"}
              onValueChange={(value) =>
                setValues({ ...values, branch_id: value === "none" ? null : value })
              }
            >
              <SelectTrigger id="employee-branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No branch</SelectItem>
                {(branches.data ?? []).map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-2 rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-medium">Roles</legend>
            {ROLE_PRIORITY.map((role) => (
              <label key={role} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={roles.includes(role)}
                  onCheckedChange={(checked) =>
                    setRoles((current) =>
                      checked === true
                        ? [...new Set([...current, role])]
                        : current.filter((value) => value !== role),
                    )
                  }
                  aria-label={ROLE_LABELS[role]}
                />
                {ROLE_LABELS[role]}
              </label>
            ))}
          </fieldset>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="employee-active" className="text-sm font-medium">
              Active employee
            </Label>
            <Switch
              id="employee-active"
              checked={values.is_active}
              onCheckedChange={(checked) => setValues({ ...values, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
