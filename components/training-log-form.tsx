"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, SquareCheckBig } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function TrainingLogForm({ studentId }: { studentId?: string }) {
  const router = useRouter();
  const [result, setResult] = useState("");
  const [duration, setDuration] = useState("");
  const [rpe, setRpe] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [completedLocked, setCompletedLocked] = useState(false);

  const hasInput = useMemo(() => Boolean(result.trim() || duration.trim() || rpe.trim() || note.trim()), [duration, note, result, rpe]);

  function updateResult(value: string) {
    setResult(value);
    setCompletedLocked(false);
  }

  function updateDuration(value: string) {
    setDuration(value);
    setCompletedLocked(false);
  }

  function updateRpe(value: string) {
    setRpe(value);
    setCompletedLocked(false);
  }

  function updateNote(value: string) {
    setNote(value);
    setCompletedLocked(false);
  }

  async function submit(status: "PROSES" | "SELESAI") {
    if (status === "SELESAI") {
      const missing = [
        !result.trim() ? "hasil latihan" : null,
        !duration.trim() ? "durasi" : null,
        !rpe.trim() ? "RPE" : null
      ].filter(Boolean);

      if (missing.length > 0) {
        setMessage(`Lengkapi ${missing.join(", ")} sebelum menyelesaikan latihan.`);
        return;
      }

      if (completedLocked) {
        setMessage("Latihan ini sudah selesai disimpan. Isi data baru untuk menyimpan latihan berikutnya.");
        return;
      }
    }

    setSaving(true);
    setMessage("");
    const response = await fetch("/api/training-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        result: result || (status === "PROSES" ? "Latihan dimulai" : "Latihan selesai"),
        duration: duration || "0 menit",
        rpe: Number(rpe || 100),
        note,
        status
      })
    });
    setSaving(false);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan log latihan" }));
      setMessage(error.error ?? "Gagal menyimpan log latihan");
      return;
    }

    setMessage(status === "PROSES" ? "Latihan proses tersimpan atau diperbarui." : "Latihan selesai disimpan. Form dikosongkan agar tidak tersimpan dua kali.");
    if (status === "SELESAI") {
      setResult("");
      setDuration("");
      setRpe("");
      setNote("");
      setCompletedLocked(true);
    }
    router.refresh();
  }

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="space-y-1">
        <label className="text-xs font-medium">Hasil latihan</label>
        <Input placeholder="contoh: 252/300" value={result} onChange={(event) => updateResult(event.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Durasi</label>
        <Input placeholder="75 menit" value={duration} onChange={(event) => updateDuration(event.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">RPE</label>
        <Input type="number" min={1} max={1000} placeholder="1-1000" value={rpe} onChange={(event) => updateRpe(event.target.value)} />
      </div>
      <div className="flex items-end gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => submit("PROSES")} disabled={saving || !hasInput}>
          <Play className="h-3.5 w-3.5" />
          Mulai
        </Button>
        <Button size="sm" className="flex-1" onClick={() => submit("SELESAI")} disabled={saving || completedLocked}>
          <SquareCheckBig className="h-3.5 w-3.5" />
          Selesai
        </Button>
      </div>
      <div className="space-y-1 md:col-span-4">
        <label className="text-xs font-medium">Catatan</label>
        <Textarea placeholder="Catatan coach atau evaluasi mandiri murid" value={note} onChange={(event) => updateNote(event.target.value)} />
      </div>
      {message ? (
        <p className={message.includes("Gagal") || message.includes("Lengkapi") ? "text-xs text-red-700 md:col-span-4" : "text-xs text-emerald-700 md:col-span-4"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
