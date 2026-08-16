# Authentication policy

## Current implementation

- `/login` is exclusively for returning users.
- `/signup` creates an email/password account and validates an eight-character minimum password plus confirmation.
- `/forgot-password` and `/reset-password` use Supabase’s email recovery flow.
- `/auth/callback` exchanges Supabase’s PKCE code for a session and returns the user to a local `next` path.
- `/auth/confirm` verifies email confirmation and recovery `token_hash` values server-side. This avoids relying on a PKCE verifier cookie that may not exist when an email is opened in another browser.
- Protected routes preserve their intended local destination through login.

## Username policy

Usernames are normalized to lowercase and must contain 3–24 lowercase letters, digits, or underscores. A case-insensitive database index is the final uniqueness guarantee.

Accounts created before profile onboarding receive a valid, non-publicly-meaningful temporary username in the form `user_<18 UUID characters>`. Phase C will require users to choose a permanent nickname and will set `onboarding_completed_at`.

## Email confirmation policy

Email confirmation should be **enabled in production** and may be disabled only in local development. When confirmation is enabled, signup shows a neutral confirmation notice instead of starting a session immediately.

Configure these redirect URLs in Supabase Auth:

- `http://localhost:3000/auth/callback` for local development
- `<production-origin>/auth/callback` for production

Set `NEXT_PUBLIC_SITE_URL` in deployed environments when the request origin is not available to server actions.

## Email templates

Use the following link format in both **Confirm signup** and **Reset password** templates in Supabase Auth → Email Templates:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">
  Confirm your email
</a>
```

For **Reset password**, change only `type=email` to `type=recovery` and the link text accordingly. Do not use `{{ .SiteURL }}` alone, because that bypasses verification; do not use a link-tracking service for these emails.

## Avatar storage policy

The `avatars` bucket is public for profile display, accepts JPEG/PNG/WebP only, limits files to 5 MB, and permits authenticated users to manage only files below their own `<user-id>/` folder.
