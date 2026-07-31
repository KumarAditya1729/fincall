import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { PaginatedResult, PaginationState } from "@/types";

/** Holiday calendar — collection is suspended on these dates per branch. */

export interface Holiday {
  id: string;
  name: string;
  holiday_date: string;
  branch_id: string | null;
  is_recurring: boolean;
  deleted_at: string | null;
  branch: { id: string; name: string } | null;
}

export const holidaySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
  branch_id: z.string().uuid().nullable(),
  is_recurring: z.boolean(),
});

export type HolidayInput = z.infer<typeof holidaySchema>;

export async function fetchHolidays(
  filters: { year: string; branchId: string | "all" },
  pagination: PaginationState,
): Promise<PaginatedResult<Holiday>> {
  const from = (pagination.page - 1) * pagination.pageSize;
  let query = supabase
    .from("holidays")
    .select("*, branch:branches(id, name)", { count: "exact" })
    .is("deleted_at", null)
    .gte("holiday_date", `${filters.year}-01-01`)
    .lte("holiday_date", `${filters.year}-12-31`)
    .order("holiday_date")
    .range(from, from + pagination.pageSize - 1);

  if (filters.branchId !== "all") query = query.eq("branch_id", filters.branchId);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Holiday[], total: count ?? 0 };
}

export async function createHoliday(input: HolidayInput): Promise<void> {
  const { error } = await supabase.from("holidays").insert(holidaySchema.parse(input));
  if (error) throw error;
}

export async function updateHoliday(id: string, input: HolidayInput): Promise<void> {
  const { error } = await supabase.from("holidays").update(holidaySchema.parse(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteHolidays(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("holidays")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

/** Working hours — one row per weekday, optionally overridden per branch. */

export interface WorkingHour {
  id: string;
  branch_id: string | null;
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_working_day: boolean;
}

export const workingHourSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    is_working_day: z.boolean(),
    opens_at: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
    closes_at: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  })
  .refine((value) => !value.is_working_day || value.opens_at < value.closes_at, {
    message: "Closing time must be after opening time",
    path: ["closes_at"],
  });

export type WorkingHourInput = z.infer<typeof workingHourSchema>;

export async function fetchWorkingHours(branchId: string | null): Promise<WorkingHour[]> {
  let query = supabase
    .from("working_hours")
    .select("id, branch_id, day_of_week, start_time, end_time, is_working_day")
    .is("deleted_at", null)
    .order("day_of_week");
  query = branchId ? query.eq("branch_id", branchId) : query.is("branch_id", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    branch_id: row.branch_id,
    weekday: row.day_of_week,
    opens_at: row.start_time?.slice(0, 5) ?? null,
    closes_at: row.end_time?.slice(0, 5) ?? null,
    is_working_day: row.is_working_day,
  }));
}

export async function saveWorkingHours(
  branchId: string | null,
  rows: WorkingHourInput[],
): Promise<void> {
  const parsed = rows.map((row) => workingHourSchema.parse(row));
  const { error } = await supabase.from("working_hours").upsert(
    parsed.map((row) => ({
      branch_id: branchId,
      day_of_week: row.weekday,
      is_working_day: row.is_working_day,
      start_time: `${row.opens_at}:00`,
      end_time: `${row.closes_at}:00`,
    })),
    { onConflict: "branch_id,day_of_week" },
  );
  if (error) throw error;
}

/** Notification templates used for SMS / email / in-app reminders. */

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  is_active: boolean;
  deleted_at: string | null;
  updated_at: string;
}

export const templateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  channel: z.enum(["sms", "email", "whatsapp", "in_app"]),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(5, "Body must be at least 5 characters").max(2000),
  is_active: z.boolean(),
});

export type TemplateInput = z.infer<typeof templateSchema>;

export async function fetchTemplates(
  filters: { channel: string },
  pagination: PaginationState,
): Promise<PaginatedResult<NotificationTemplate>> {
  const from = (pagination.page - 1) * pagination.pageSize;
  let query = supabase
    .from("notification_templates")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("name")
    .range(from, from + pagination.pageSize - 1);
  if (filters.channel !== "all") query = query.eq("channel", filters.channel);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as NotificationTemplate[], total: count ?? 0 };
}

export async function createTemplate(input: TemplateInput): Promise<void> {
  const parsed = templateSchema.parse(input);
  const { error } = await supabase
    .from("notification_templates")
    .insert({ ...parsed, subject: parsed.subject || null });
  if (error) throw error;
}

export async function updateTemplate(id: string, input: TemplateInput): Promise<void> {
  const parsed = templateSchema.parse(input);
  const { error } = await supabase
    .from("notification_templates")
    .update({ ...parsed, subject: parsed.subject || null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTemplates(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("notification_templates")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .in("id", ids);
  if (error) throw error;
}

/** Company settings are stored as JSON documents in `settings`. */

export const COMPANY_SETTINGS_KEY = "company_profile";

export const companySettingsSchema = z.object({
  company_name: z.string().trim().min(2, "Company name is required").max(160),
  registered_address: z.string().trim().max(300).optional().or(z.literal("")),
  support_email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(255)
    .optional()
    .or(z.literal("")),
  support_phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, "Phone may only contain digits")
    .optional()
    .or(z.literal("")),
  grievance_officer: z.string().trim().max(120).optional().or(z.literal("")),
  call_recording_disclaimer: z.string().trim().max(500).optional().or(z.literal("")),
  max_daily_call_attempts: z.coerce.number().int().min(1).max(20),
});

export type CompanySettings = z.infer<typeof companySettingsSchema>;

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  company_name: "",
  registered_address: "",
  support_email: "",
  support_phone: "",
  grievance_officer: "",
  call_recording_disclaimer: "",
  max_daily_call_attempts: 3,
};

export async function fetchCompanySettings(): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", COMPANY_SETTINGS_KEY)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;

  const parsed = companySettingsSchema.safeParse(data?.value ?? {});
  return parsed.success ? parsed.data : DEFAULT_COMPANY_SETTINGS;
}

export async function saveCompanySettings(input: CompanySettings): Promise<void> {
  const parsed = companySettingsSchema.parse(input);
  const { error } = await supabase.from("settings").upsert(
    {
      key: COMPANY_SETTINGS_KEY,
      value: parsed as never,
      description: "Company profile and compliance defaults",
    },
    { onConflict: "key" },
  );
  if (error) throw error;
}
