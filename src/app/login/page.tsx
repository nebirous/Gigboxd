import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-md">
        <h1 className="mb-2 text-2xl font-bold text-white font-outfit">
          Welcome to Gigboxd
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Sign in to log your live music history.
        </p>

        <form className="flex flex-col gap-4">
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
            <button
              formAction={signup}
              className="w-full rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
