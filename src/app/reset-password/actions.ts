"use server";

import { redirect } from "next/navigation";
import { validatePassword } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") || "");
  const passwordError = validatePassword(password);

  if (passwordError) {
    redirect(`/reset-password?error=${encodeURIComponent(passwordError)}`);
  }

  if (password !== passwordConfirmation) {
    redirect(`/reset-password?error=${encodeURIComponent("Passwords do not match.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent("This reset link is invalid or has expired. Request a new one.")}`);
  }

  redirect(`/login?message=${encodeURIComponent("Your password has been updated. You can now log in.")}`);
}
