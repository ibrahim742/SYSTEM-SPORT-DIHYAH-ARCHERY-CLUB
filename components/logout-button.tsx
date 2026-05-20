"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  async function logout() {
    await signOut({ redirect: false, callbackUrl: "/login" });
    window.location.href = "/login";
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout}>
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
