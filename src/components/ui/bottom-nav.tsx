"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, BookOpen, User } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/discover", icon: Search, label: "Discover" },
  { href: "/log", icon: PlusCircle, label: "Log", isCenter: true },
  { href: "/diary", icon: BookOpen, label: "Diary" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on login/signup pages
  if (pathname === "/login" || pathname === "/error") return null;

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-zinc-800/50 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center -mt-6 rounded-full bg-neon-fuchsia p-3.5 shadow-lg transition-transform hover:scale-105 active:scale-95 glow-fuchsia"
                >
                  <Icon size={24} className="text-white" />
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                  isActive
                    ? "text-neon-cyan"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 flex-col border-r border-zinc-800/50 glass z-50">
        {/* Logo */}
        <div className="p-6 pb-4">
          <Link href="/" className="block">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Gig<span className="text-neon-fuchsia">boxd</span>
            </h1>
            <p className="text-[11px] text-zinc-500 mt-0.5 tracking-wider uppercase">
              Your Live Music Diary
            </p>
          </Link>
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-1 px-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 mt-2 mb-2 rounded-xl bg-neon-fuchsia text-white font-semibold transition-all hover:brightness-110 active:scale-[0.98] glow-fuchsia"
                >
                  <Icon size={20} />
                  <span>{item.label} a Show</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors",
                  isActive
                    ? "bg-zinc-800/80 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={isActive ? "text-neon-cyan" : ""}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/50">
          <p className="text-[10px] text-zinc-600 text-center">
            © 2026 Gigboxd
          </p>
        </div>
      </nav>
    </>
  );
}
