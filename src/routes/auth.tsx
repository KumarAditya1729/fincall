import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME, AUDIT_ACTIONS, QUERY_KEYS } from "@/constants";
import { recordAudit } from "@/features/audit/services/auditService";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordValues,
  type SignInValues,
  type SignUpValues,
} from "@/features/auth/schemas/authSchemas";
import {
  fetchCurrentUser,
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "@/features/auth/services/authService";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Recovera Recovery Platform" },
      {
        name: "description",
        content:
          "Secure sign in for microfinance recovery teams. Access branch dashboards, borrower calling and follow-up workflows.",
      },
      { property: "og:title", content: "Sign in — Recovera Recovery Platform" },
      {
        property: "og:description",
        content:
          "Secure role-based access for super admins, branch managers and recovery executives.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoading && user) void navigate({ to: "/dashboard", replace: true });
  }, [isLoading, user, navigate]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const forgotForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function afterSignIn() {
    const current = await queryClient.fetchQuery({
      queryKey: QUERY_KEYS.currentUser,
      queryFn: fetchCurrentUser,
    });
    if (current) {
      await recordAudit({
        action: AUDIT_ACTIONS.LOGIN,
        userId: current.id,
        branchId: current.branchId,
      });
    }
    await navigate({ to: "/dashboard", replace: true });
  }

  async function onSignIn(values: SignInValues) {
    setPending(true);
    try {
      await signInWithPassword(values.email, values.password);
      await afterSignIn();
    } catch (error) {
      toastError(error, "Unable to sign in");
    } finally {
      setPending(false);
    }
  }

  async function onSignUp(values: SignUpValues) {
    setPending(true);
    try {
      const { needsConfirmation } = await signUpWithPassword(
        values.email,
        values.password,
        values.fullName,
      );
      if (needsConfirmation) {
        toast.success("Account created. Check your email to confirm before signing in.");
        setMode("signin");
      } else {
        await afterSignIn();
      }
    } catch (error) {
      toastError(error, "Unable to create account");
    } finally {
      setPending(false);
    }
  }

  async function onForgot(values: ForgotPasswordValues) {
    setPending(true);
    try {
      await requestPasswordReset(values.email);
      toast.success("If that email exists, a reset link is on its way.");
      setMode("signin");
    } catch (error) {
      toastError(error, "Unable to send reset email");
    } finally {
      setPending(false);
    }
  }

  const onGoogle = async () => {
    try {
      setPending(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
            R
          </span>
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        <Card className="border-border shadow-[var(--shadow-elevated)]">
          <CardHeader>
            <CardTitle className="text-xl">
              {mode === "signup"
                ? "Create your account"
                : mode === "forgot"
                  ? "Reset your password"
                  : "Sign in to your workspace"}
            </CardTitle>
            <CardDescription>
              {mode === "forgot"
                ? "We'll email you a secure link to set a new password."
                : "Role-based access for recovery teams."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {mode === "forgot" ? (
              <Form {...forgotForm}>
                <form className="space-y-4" onSubmit={forgotForm.handleSubmit(onForgot)}>
                  <FormField
                    control={forgotForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
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
                    {pending ? "Sending…" : "Send reset link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setMode("signin")}
                  >
                    Back to sign in
                  </Button>
                </form>
              </Form>
            ) : (
              <Tabs
                value={mode}
                onValueChange={(value) => setMode(value === "signup" ? "signup" : "signin")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="pt-4">
                  <Form {...signInForm}>
                    <form className="space-y-4" onSubmit={signInForm.handleSubmit(onSignIn)}>
                      <FormField
                        control={signInForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work email</FormLabel>
                            <FormControl>
                              <Input type="email" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signInForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" autoComplete="current-password" {...field} />
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
                        {pending ? "Signing in…" : "Sign in"}
                      </Button>
                      <button
                        type="button"
                        className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                        onClick={() => setMode("forgot")}
                      >
                        Forgot password?
                      </button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="signup" className="pt-4">
                  <Form {...signUpForm}>
                    <form className="space-y-4" onSubmit={signUpForm.handleSubmit(onSignUp)}>
                      <FormField
                        control={signUpForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input autoComplete="name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signUpForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work email</FormLabel>
                            <FormControl>
                              <Input type="email" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signUpForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
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
                        {pending ? "Creating account…" : "Create account"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        The first account created becomes the Super Admin. Later accounts start as
                        Recovery Executives and can be re-assigned.
                      </p>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            )}

            {mode !== "forgot" ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={pending}
                  onClick={() => void onGoogle()}
                >
                  Continue with Google
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
