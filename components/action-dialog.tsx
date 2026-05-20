"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContentModal } from "@/components/content-modal";

type DialogTone = "danger" | "info" | "success";
type DialogState = {
  body?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  mode: "alert" | "confirm";
  resolve?: (value: boolean) => void;
  title: string;
  tone: DialogTone;
};

const toneStyle = {
  danger: {
    icon: XCircle,
    iconClass: "bg-red-50 text-red-600",
    buttonClass: "bg-red-600 hover:bg-red-700"
  },
  info: {
    icon: Info,
    iconClass: "bg-sky-50 text-sky-600",
    buttonClass: "bg-sky-600 hover:bg-sky-700"
  },
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700"
  }
};

export function useActionDialog() {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const close = useCallback(
    (value: boolean) => {
      setDialog((current) => {
        current?.resolve?.(value);
        return null;
      });
    },
    []
  );

  const notify = useCallback((title: string, body?: string, tone: DialogTone = "info") => {
    setDialog({ title, body, mode: "alert", tone, confirmLabel: "Mengerti" });
  }, []);

  const confirm = useCallback((title: string, body?: string, tone: DialogTone = "danger") => {
    return new Promise<boolean>((resolve) => {
      setDialog({ title, body, mode: "confirm", tone, resolve, confirmLabel: "Ya, lanjutkan", cancelLabel: "Batal" });
    });
  }, []);

  const Dialog = useCallback(() => {
    if (!dialog) return null;
    const style = toneStyle[dialog.tone];
    const Icon = dialog.mode === "confirm" && dialog.tone === "danger" ? AlertTriangle : style.icon;

    return (
      <ContentModal className="max-w-sm">
        <div className="p-4">
          <div className="flex gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${style.iconClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950">{dialog.title}</h3>
              {dialog.body ? <p className="mt-1 text-sm leading-6 text-slate-600">{dialog.body}</p> : null}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t bg-slate-50 px-4 py-3">
          {dialog.mode === "confirm" ? (
            <Button variant="outline" onClick={() => close(false)}>
              {dialog.cancelLabel}
            </Button>
          ) : null}
          <Button className={style.buttonClass} onClick={() => close(true)}>
            {dialog.confirmLabel}
          </Button>
        </div>
      </ContentModal>
    );
  }, [close, dialog]);

  return { Dialog, confirm, notify };
}
