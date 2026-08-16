import Link from "next/link";
import { requestPasswordReset } from "./actions";

interface ForgotPasswordPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { error, message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-md">
        <h1 className="mb-2 text-2xl font-bold text-white font-outfit">Reset your password</h1>
        <p className="mb-6 text-sm text-zinc-400">Enter your email and we’ll send you a reset link.</p>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">{message}</p>}
        <form action={requestPasswordReset} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-300" htmlFor="email">
            Email
            <input id="email" name="email" type="email" autoComplete="email" required className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" placeholder="you@example.com" />
          </label>
          <button type="submit" className="mt-2 w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200">Send reset link</button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400"><Link href="/login" className="font-semibold text-neon-cyan hover:text-white">Back to login</Link></p>
      </div>
    </div>
  );
}
