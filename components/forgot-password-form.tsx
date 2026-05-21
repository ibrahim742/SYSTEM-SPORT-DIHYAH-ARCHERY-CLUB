"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") })
    });
    const payload = await response.json().catch(() => ({}));

    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Gagal mengirim tautan reset password.");
      return;
    }

    setMessage(payload.message ?? "Jika email terdaftar, tautan reset password akan dikirim.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-sm overflow-hidden rounded-md border bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 px-4 py-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white">
            <Mail className="h-5 w-5" />
          </div>
          <h1 className="text-base font-semibold">Lupa password</h1>
          <p className="text-xs text-muted-foreground">Masukkan email yang tertaut pada akun Anda.</p>
        </div>
        <form className="space-y-3 p-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium">Email</label>
            <Input name="email" autoComplete="email" required type="email" />
          </div>
          {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Mengirim..." : "Kirim tautan reset"}
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
