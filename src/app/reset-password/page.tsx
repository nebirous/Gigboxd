import Link from "next/link";
import { resetPassword } from "./actions";

interface ResetPasswordPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-md">
        <h1 className="mb-2 text-2xl font-bold text-white font-outfit">Choose a new password</h1>
        <p className="mb-6 text-sm text-zinc-400">Use at least eight characters.</p>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <form action={resetPassword} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-300" htmlFor="password">
            New password
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-300" htmlFor="passwordConfirmation">
            Confirm new password
            <input id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} required className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
          </label>
          <button type="submit" className="mt-2 w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200">Update password</button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400"><Link href="/forgot-password" className="font-semibold text-neon-cyan hover:text-white">Request a new link</Link></p>
      </div>
    </div>
  );
}
