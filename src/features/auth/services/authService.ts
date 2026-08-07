import { supabase } from "@/integrations/supabase/client";
import { ROLE_PRIORITY } from "@/constants";
import type { AppRole, CurrentUser, Profile } from "@/types";

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const userId = userData.user.id;

  const [profileResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (rolesResult.error) throw rolesResult.error;

  const profile = (profileResult.data ?? null) as Profile | null;
  const roles = (rolesResult.data ?? []).map((row) => row.role as AppRole);
  const primaryRole = ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;

  let branch: { id: string; name: string } | null = null;
  if (profile?.branch_id) {
    const branchResult = await supabase
      .from("branches")
      .select("id, name")
      .eq("id", profile.branch_id)
      .maybeSingle();
    if (branchResult.error) throw branchResult.error;
    branch = branchResult.data;
  }

  return {
    id: userId,
    email: userData.user.email ?? "",
    profile,
    roles,
    primaryRole,
    branchId: profile?.branch_id ?? null,
    branch,
  };
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(
  email: string,
  password: string,
  fullName: string,
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: { full_name: fullName },
    },
  });
  if (error) throw error;
  return { needsConfirmation: data.session === null };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
