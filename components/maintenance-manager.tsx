"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

import { useActionDialog } from "@/components/action-dialog";
import { Button } from "@/components/ui/button";

type CleanupResult = {
  deletedAuditLogs: number;
  deletedBytes: number;
  deletedFiles: number;
  logRetentionDays: number;
  uploadGraceDays: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MaintenanceManager() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { Dialog, confirm } = useActionDialog();

  async function cleanup() {
    const approved = await confirm("Bersihkan data lama?", "Audit log lama dan file upload tidak terpakai akan dihapus permanen.");
    if (!approved) return;
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/maintenance/cleanup", { method: "POST" });
    setSaving(false);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal membersihkan data lama" }));
      setMessage(error.error ?? "Gagal membersihkan data lama");
      return;
    }

    const result = (await response.json()) as { data: CleanupResult };
    setMessage(`Selesai. ${result.data.deletedAuditLogs} audit log lama dan ${result.data.deletedFiles} file tidak terpakai dibersihkan (${formatBytes(result.data.deletedBytes)}).`);
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Maintenance Sistem</h2>
          <p className="text-xs text-muted-foreground">Bersihkan audit log lebih dari 90 hari dan file upload tidak terpakai lebih dari 7 hari.</p>
        </div>
        <Button size="sm" variant="outline" onClick={cleanup} disabled={saving}>
          {saving ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {saving ? "Membersihkan..." : "Bersihkan Lama"}
        </Button>
      </div>
      <div className="p-3 text-xs leading-5 text-muted-foreground">
        File yang masih dipakai oleh branding, landing page, akun, coach, atau murid tidak akan dihapus.
      </div>
      {message ? <div className="border-t bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">{message}</div> : null}
      <Dialog />
    </section>
  );
}
