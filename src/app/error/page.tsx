export default function ErrorPage() {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white gap-4">
        <h1 className="text-4xl font-bold text-fuchsia-500 font-outfit">Oops!</h1>
        <p className="text-zinc-400">Sorry, something went wrong with the authentication process.</p>
        <a href="/login" className="rounded-lg bg-zinc-800 px-4 py-2 hover:bg-zinc-700 transition">
            Go back to Login
        </a>
      </div>
    );
  }
  
