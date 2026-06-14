"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={() => void signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">退出</span>
    </button>
  );
}
