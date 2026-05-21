"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (password !== confirmation) {
      setLoading(false);
      setError("Konfirmasi password tidak sama.");
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const payload = await response.json().catch(() => ({}));

    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Gagal mengubah password.");
      return;
    }

    setMessage(payload.message ?? "Password berhasil diubah. Silakan login dengan password baru.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-sm overflow-hidden rounded-md border bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 px-4 py-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="text-base font-semibold">Reset password</h1>
          <p className="text-xs text-muted-foreground">Buat password baru minimal 8 karakter.</p>
        </div>
        <form className="space-y-3 p-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium">Password baru</label>
            <Input name="password" autoComplete="new-password" required type="password" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Konfirmasi password</label>
            <Input name="confirmation" autoComplete="new-password" required type="password" />
          </div>
          {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p> : null}
          <Button className="w-full" disabled={loading || !token} type="submit">
            {loading ? "Menyimpan..." : "Simpan password baru"}
          </Button>
          <Link className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800" href="/login">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke login
          </Link>
        </form>
      </section>
    </main>
  );
}
