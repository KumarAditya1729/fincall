import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { QUERY_KEYS } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import {
  companySettingsSchema,
  DEFAULT_COMPANY_SETTINGS,
  fetchCompanySettings,
  saveCompanySettings,
  type CompanySettings,
} from "@/features/admin/services/orgSettingsService";
import { toastError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Company Settings — Recovera" },
      {
        name: "description",
        content: "Company profile, grievance contacts and calling policy defaults.",
      },
      { property: "og:title", content: "Company Settings — Recovera" },
      {
        property: "og:description",
        content: "Organisation identity and compliance defaults for the recovery platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const settings = useQuery({
    queryKey: QUERY_KEYS.adminCompanySettings,
    queryFn: fetchCompanySettings,
  });

  useEffect(() => {
    if (settings.data) setValues(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = companySettingsSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
        throw new Error("Fix the highlighted fields and try again.");
      }
      setErrors({});
      await saveCompanySettings(parsed.data);
    },
    onSuccess: async () => {
      toast.success("Company settings saved");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompanySettings });
    },
    onError: (error) => toastError(error, "Could not save the company settings"),
  });

  return (
    <AppShell>
      <AdminGuard>
        <div className="space-y-6">
          <PageHeader
            title="Company settings"
            description="Shown on borrower communication and used as compliance defaults."
          />
          <AdminTabs />

          {settings.isLoading ? (
            <Skeleton className="h-80 w-full rounded-xl" />
          ) : settings.error ? (
            <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
          ) : (
            <form
              className="space-y-4 rounded-xl border border-border bg-card p-5"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name">Company name</Label>
                  <Input
                    id="company-name"
                    value={values.company_name}
                    maxLength={160}
                    onChange={(event) =>
                      setValues({ ...values, company_name: event.target.value })
                    }
                    aria-invalid={errors["company_name"] ? true : undefined}
                  />
                  {errors["company_name"] ? (
                    <p className="text-xs text-danger">{errors["company_name"]}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company-grievance">Grievance officer</Label>
                  <Input
                    id="company-grievance"
                    value={values.grievance_officer ?? ""}
                    maxLength={120}
                    onChange={(event) =>
                      setValues({ ...values, grievance_officer: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company-email">Support email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={values.support_email ?? ""}
                    maxLength={255}
                    onChange={(event) =>
                      setValues({ ...values, support_email: event.target.value })
                    }
                    aria-invalid={errors["support_email"] ? true : undefined}
                  />
                  {errors["support_email"] ? (
                    <p className="text-xs text-danger">{errors["support_email"]}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company-phone">Support phone</Label>
                  <Input
                    id="company-phone"
                    inputMode="tel"
                    value={values.support_phone ?? ""}
                    maxLength={20}
                    onChange={(event) =>
                      setValues({ ...values, support_phone: event.target.value })
                    }
                    aria-invalid={errors["support_phone"] ? true : undefined}
                  />
                  {errors["support_phone"] ? (
                    <p className="text-xs text-danger">{errors["support_phone"]}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company-address">Registered address</Label>
                <Textarea
                  id="company-address"
                  rows={3}
                  maxLength={300}
                  value={values.registered_address ?? ""}
                  onChange={(event) =>
                    setValues({ ...values, registered_address: event.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company-disclaimer">Call recording disclaimer</Label>
                <Textarea
                  id="company-disclaimer"
                  rows={3}
                  maxLength={500}
                  value={values.call_recording_disclaimer ?? ""}
                  onChange={(event) =>
                    setValues({ ...values, call_recording_disclaimer: event.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5 md:w-64">
                <Label htmlFor="company-attempts">Max daily call attempts</Label>
                <Input
                  id="company-attempts"
                  type="number"
                  min={1}
                  max={20}
                  value={values.max_daily_call_attempts}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      max_daily_call_attempts: Number(event.target.value),
                    })
                  }
                />
              </div>

              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save settings"}
              </Button>
            </form>
          )}
        </div>
      </AdminGuard>
    </AppShell>
  );
}
