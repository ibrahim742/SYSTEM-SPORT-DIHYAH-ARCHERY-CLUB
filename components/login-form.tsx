"use client";

import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { BarChart3, LockKeyhole, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginBranding = {
  systemName: string;
  loginSubtitle: string;
  logoUrl: string | null;
};

function normalizeRedirectUrl(url: string | null | undefined) {
  if (!url) return "/";
  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch {
    return "/";
  }
}

export function LoginForm({ branding, callbackUrl }: { branding: LoginBranding; callbackUrl?: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
      callbackUrl: callbackUrl || "/dashboard"
    });

    setLoading(false);
    if (response?.error) {
      setError("Username atau password tidak sesuai.");
      return;
    }

    const session = await getSession();
    const fallbackTarget = session?.user?.role === "MURID" ? "/portal" : "/dashboard";
    window.location.href = normalizeRedirectUrl(callbackUrl || response?.url || fallbackTarget);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-sm overflow-hidden rounded-md border bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 px-4 py-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-emerald-600 text-white">
            {branding.logoUrl ? <Image src={branding.logoUrl} alt={branding.systemName} width={36} height={36} unoptimized className="h-full w-full object-cover" /> : <BarChart3 className="h-5 w-5" />}
          </div>
          <h1 className="text-base font-semibold">{branding.systemName}</h1>
          <p className="text-xs text-muted-foreground">{branding.loginSubtitle}</p>
        </div>
        <form className="space-y-3 p-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium">Username</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-7" name="username" autoComplete="username" required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-7" name="password" autoComplete="current-password" required type="password" />
            </div>
          </div>
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </section>
    </main>
  );
}
