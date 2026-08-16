import { headers } from "next/headers";

const DEFAULT_AUTH_DESTINATION = "/profile";

export function getSafeAuthDestination(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_DESTINATION;
  }

  return value;
}

export async function getAuthCallbackUrl(nextPath: string) {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin")
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? "http://localhost:3000";
  const url = new URL("/auth/callback", origin);

  url.searchParams.set("next", getSafeAuthDestination(nextPath));
  return url.toString();
}

export function validatePassword(password: string) {
  return password.length >= 8
    ? null
    : "Password must contain at least 8 characters.";
}
