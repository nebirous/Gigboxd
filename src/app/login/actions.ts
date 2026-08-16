"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAuthCallbackUrl, getSafeAuthDestination, validatePassword } from "@/lib/auth";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const nextPath = getSafeAuthDestination(formData.get("next"));

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Email or password is incorrect.")}&next=${encodeURIComponent(nextPath)}`);
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const nextPath = getSafeAuthDestination(formData.get("next"));
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") || "");
  const passwordError = validatePassword(password);

  if (!email) {
    redirect(`/signup?error=${encodeURIComponent("Email is required.")}&next=${encodeURIComponent(nextPath)}`);
  }

  if (passwordError) {
    redirect(`/signup?error=${encodeURIComponent(passwordError)}&next=${encodeURIComponent(nextPath)}`);
  }

  if (password !== passwordConfirmation) {
    redirect(`/signup?error=${encodeURIComponent("Passwords do not match.")}&next=${encodeURIComponent(nextPath)}`);
  }

  const data = {
    email,
    password,
  };

  const { data: signUpData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: await getAuthCallbackUrl(nextPath),
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(nextPath)}`);
  }

  revalidatePath("/", "layout");
  if (!signUpData.session) {
    redirect(`/login?message=${encodeURIComponent("Check your email to confirm your account before signing in.")}&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
