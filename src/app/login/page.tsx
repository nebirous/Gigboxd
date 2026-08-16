import Link from "next/link";
import { login } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message, next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/profile";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-md">
        <h1 className="mb-2 text-2xl font-bold text-white font-outfit">
          Welcome to Gigboxd
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Sign in to continue your live music diary.
        </p>

        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mb-4 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">
            {message}
          </p>
        )}

        <form className="flex flex-col gap-4">
          <input type="hidden" name="next" value={nextPath} />
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-medium text-zinc-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
            />
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <button
              formAction={login}
              className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Log In
            </button>
            <Link href="/forgot-password" className="text-center text-sm text-zinc-400 hover:text-white">
              Forgot your password?
            </Link>
          </div>
        </form>
        <p className="mt-6 border-t border-zinc-800 pt-5 text-center text-sm text-zinc-400">
          New to Gigboxd?{" "}
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-neon-cyan hover:text-white">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
