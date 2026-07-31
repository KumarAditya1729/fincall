import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { toastError } from "@/lib/errors";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, type ResetPasswordValues } from "@/features/auth/schemas/authSchemas";
import { updatePassword } from "@/features/auth/services/authService";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Recovera" },
      {
        name: "description",
        content: "Choose a new password for your Recovera loan recovery workspace account.",
      },
      { property: "og:title", content: "Set a new password — Recovera" },
      {
        property: "og:description",
        content: "Complete your password reset and regain access to your recovery workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setPending(true);
    try {
      await updatePassword(values.password);
      toast.success("Password updated. You're all set.");
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toastError(error, "Unable to update password");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border shadow-[var(--shadow-elevated)]">
        <CardHeader>
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>Choose a strong password of at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {pending ? "Updating…" : "Update password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
