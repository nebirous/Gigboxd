import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

function getSafeDestination(value: string | null, request: NextRequest) {
  if (!value) return "/profile";

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const destination = new URL(value);
    if (destination.origin !== request.nextUrl.origin) {
      return "/profile";
    }

    // The application passes an auth callback URL as redirectTo. Email
    // templates forward that whole URL, so unwrap its local destination.
    const nestedNext = destination.searchParams.get("next");
    if (destination.pathname === "/auth/callback" && nestedNext) {
      return getSafeDestination(nestedNext, request);
    }

    return `${destination.pathname}${destination.search}`;
  } catch {
    return "/profile";
  }
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const nextPath = getSafeDestination(
    request.nextUrl.searchParams.get("next") ?? request.nextUrl.searchParams.get("redirect_to"),
    request
  );
  const response = NextResponse.redirect(new URL(nextPath, request.url));

  if (!tokenHash || (type !== "email" && type !== "recovery")) {
    return NextResponse.redirect(
      new URL("/login?error=Your+email+link+is+missing+required+verification+data.", request.url)
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (!error) {
    return response;
  }

  const errorUrl = new URL(type === "recovery" ? "/forgot-password" : "/login", request.url);
  errorUrl.searchParams.set(
    "error",
    "This email link is invalid, expired, or has already been used. Request a new one."
  );
  return NextResponse.redirect(errorUrl);
}
