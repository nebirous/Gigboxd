"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./button";
import { LogGigModal } from "../log-gig-modal";

const navItems = [
  { href: "/discover", label: "DISCOVER" },
  { href: "/diary", label: "DIARY" },
  { href: "/profile", label: "PROFILE" },
];

export function TopNav() {
  const pathname = usePathname();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Hide nav on login/signup pages
  if (pathname === "/login" || pathname === "/error") return null;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo and Nav Links Container */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold font-outfit text-white tracking-tight">
              Gig<span className="text-neon-fuchsia">boxd</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "text-xs font-bold font-outfit tracking-wider transition-colors hover:text-white",
                    isActive ? "text-white" : "text-zinc-400"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <button className="text-zinc-400 hover:text-white transition-colors">
            <Search size={20} strokeWidth={2} />
          </button>
          
          <div className="flex">
            <Button onClick={() => setIsLogModalOpen(true)} variant="neon" size="sm" className="hidden sm:flex gap-1.5 font-outfit font-bold rounded-lg h-8 px-4 text-xs">
              <Plus size={16} strokeWidth={3} />
              LOG
            </Button>
            {/* Mobile icon-only log button */}
            <Button onClick={() => setIsLogModalOpen(true)} variant="neon" size="icon" className="sm:hidden h-8 w-8 rounded-lg">
              <Plus size={16} strokeWidth={3} />
            </Button>
          </div>
        </div>

      </div>

      {/* Mobile Nav Links - Optional, can show as subnav or hamburger, but simple scrolling row is quick */}
      <div className="flex md:hidden items-center justify-center gap-6 pb-3 px-4 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "text-[10px] font-bold font-outfit tracking-wider transition-colors hover:text-white whitespace-nowrap",
                isActive ? "text-white" : "text-zinc-400"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      </nav>

      <LogGigModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
    </>
  );
}
