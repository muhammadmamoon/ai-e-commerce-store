"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, ExternalLink, Bell, User as UserIcon } from "lucide-react";

interface AdminHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "ADMIN":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "MANAGER":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0">
      {/* Left: Quick Storefront Switcher */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md hover:border-slate-700"
        >
          <span>View Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Right: Notifications & Current Admin Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick notification button */}
        <button
          className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserIcon className="w-4 h-4" />
          </div>

          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight">
              {user.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${getRoleBadgeColor(
                  user.role,
                )}`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 ml-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            title="Log Out of Administration"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
