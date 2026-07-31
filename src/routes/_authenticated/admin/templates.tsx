import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { TablePagination } from "@/components/common/TablePagination";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { QUERY_KEYS, TEMPLATE_CHANNEL_LABELS } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import {
  createTemplate,
  deleteTemplates,
  fetchTemplates,
  templateSchema,
  updateTemplate,
  type NotificationTemplate,
  type TemplateInput,
} from "@/features/admin/services/orgSettingsService";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useTableState } from "@/hooks/useTableState";
import { toastError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/templates")({
  head: () => ({
    meta: [
      { title: "Notification Templates — Recovera" },
      {
        name: "description",
        content: "Author reusable SMS, email and WhatsApp templates for borrower communication.",
      },
      { property: "og:title", content: "Notification Templates — Recovera" },
      {
        property: "og:description",
        content: "Compliant, reusable borrower messaging templates for recovery teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TemplatesPage,
});

const EMPTY: TemplateInput = {
  code: "",
  name: "",
  channel: "sms",
  subject: "",
  body: "",
  is_active: true,
};

function TemplatesPage() {
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [values, setValues] = useState<TemplateInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();
  const selection = useRowSelection();

  const templates = useQuery({
    queryKey: [...QUERY_KEYS.adminTemplates, channel, page, pageSize],
    queryFn: () => fetchTemplates({ channel }, { page, pageSize }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!formOpen) return;
    setErrors({});
    setValues(
      editing
        ? {
            code: editing.code,
            name: editing.name,
            channel: editing.channel as TemplateInput["channel"],
            subject: editing.subject ?? "",
            body: editing.body,
            is_active: editing.is_active,
          }
        : EMPTY,
    );
  }, [formOpen, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = templateSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
        throw new Error("Fix the highlighted fields and try again.");
      }
      setErrors({});
      if (editing) await updateTemplate(editing.id, parsed.data);
      else await createTemplate(parsed.data);
    },
    onSuccess: async () => {
      toast.success(editing ? "Template updated" : "Template created");
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminTemplates });
    },
    onError: (error) => toastError(error, "Could not save the template"),
  });

  const remove = useMutation({
    mutationFn: () => deleteTemplates(selection.selectedIds),
    onSuccess: async () => {
      toast.success("Templates archived");
      selection.clear();
      setConfirmDelete(false);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminTemplates });
    },
    onError: (error) => toastError(error, "Could not archive the selected templates"),
  });

  const columns = useMemo<DataTableColumn<NotificationTemplate>[]>(
    () => [
      { id: "name", header: "Template", cell: (row) => row.name },
      { id: "code", header: "Code", cell: (row) => row.code },
      {
        id: "channel",
        header: "Channel",
        cell: (row) => (
          <Badge variant="secondary">{TEMPLATE_CHANNEL_LABELS[row.channel] ?? row.channel}</Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) =>
          row.is_active ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          ),
      },
      { id: "updated", header: "Updated", cell: (row) => formatDateTime(row.updated_at) },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(row);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <AppShell>
      <AdminGuard>
        <div className="space-y-6">
          <PageHeader
            title="Notification templates"
            description="Reusable borrower messages. Use {{name}} style placeholders for merge fields."
            actions={
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                New template
              </Button>
            }
          />
          <AdminTabs />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <FilterSelect
              value={channel}
              onChange={(value) => {
                setChannel(value);
                selection.clear();
                resetPage();
              }}
              options={[
                { value: "all", label: "All channels" },
                ...Object.entries(TEMPLATE_CHANNEL_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              label="Filter templates by channel"
              className="sm:w-[200px]"
            />
            {selection.count > 0 ? (
              <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                Archive {selection.count} selected
              </Button>
            ) : null}
          </div>

          <DataTable
            caption="Notification templates"
            columns={columns}
            rows={templates.data?.rows ?? []}
            rowKey={(row) => row.id}
            isLoading={templates.isLoading}
            error={templates.error}
            onRetry={() => void templates.refetch()}
            selection={{
              selectedIds: selection.selectedIds,
              onToggle: selection.toggle,
              onToggleAll: selection.toggleAll,
              label: "templates",
            }}
            emptyState={
              <EmptyState
                icon={MessageSquare}
                title="No templates yet"
                description="Create approved message templates so teams communicate consistently."
              />
            }
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={templates.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
              <DialogDescription>
                Keep language compliant with fair-practice collection guidelines.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="template-name">Name</Label>
                  <Input
                    id="template-name"
                    value={values.name}
                    maxLength={120}
                    onChange={(event) => setValues({ ...values, name: event.target.value })}
                    aria-invalid={errors["name"] ? true : undefined}
                  />
                  {errors["name"] ? <p className="text-xs text-danger">{errors["name"]}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="template-code">Code</Label>
                  <Input
                    id="template-code"
                    value={values.code}
                    maxLength={60}
                    disabled={Boolean(editing)}
                    onChange={(event) => setValues({ ...values, code: event.target.value })}
                    aria-invalid={errors["code"] ? true : undefined}
                  />
                  {errors["code"] ? <p className="text-xs text-danger">{errors["code"]}</p> : null}
                </div>
              </div>

              <FilterSelect
                value={values.channel}
                onChange={(value) =>
                  setValues({ ...values, channel: value as TemplateInput["channel"] })
                }
                options={Object.entries(TEMPLATE_CHANNEL_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                label="Channel"
              />

              {values.channel === "email" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="template-subject">Subject</Label>
                  <Input
                    id="template-subject"
                    value={values.subject ?? ""}
                    maxLength={160}
                    onChange={(event) => setValues({ ...values, subject: event.target.value })}
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="template-body">Message body</Label>
                <Textarea
                  id="template-body"
                  rows={6}
                  maxLength={2000}
                  value={values.body}
                  onChange={(event) => setValues({ ...values, body: event.target.value })}
                  aria-invalid={errors["body"] ? true : undefined}
                />
                {errors["body"] ? <p className="text-xs text-danger">{errors["body"]}</p> : null}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label htmlFor="template-active" className="text-sm font-medium">
                  Active
                </Label>
                <Switch
                  id="template-active"
                  checked={values.is_active}
                  onCheckedChange={(checked) => setValues({ ...values, is_active: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Archive selected templates?"
          description="Archived templates stop appearing when composing borrower messages."
          destructive
          isPending={remove.isPending}
          onConfirm={() => remove.mutate()}
        />
      </AdminGuard>
    </AppShell>
  );
}
