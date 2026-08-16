"use server";

import { redirect } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent("Email is required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await getAuthCallbackUrl("/reset-password"),
  });

  if (error) {
    console.error("Password reset request failed:", error);
  }

  // This response intentionally does not reveal whether the email exists.
  redirect(`/forgot-password?message=${encodeURIComponent("If an account exists for that email, we sent password-reset instructions.")}`);
}
