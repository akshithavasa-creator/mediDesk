"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  loading = false,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialog.showModal();
      const focusable = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? dialog).focus();
    } else {
      dialog.close();
      previousActiveElement.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl backdrop:bg-zinc-900/40"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-zinc-900"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 transition-colors hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          id="modal-description"
          className="text-sm leading-relaxed text-zinc-600"
        >
          {description}
        </div>

        <div className="flex gap-3 justify-end sm:justify-start sm:row-reverse">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700
              transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`
              rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
              ${
                confirmVariant === "danger"
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  : "bg-teal-700 hover:bg-teal-800 focus:ring-teal-500"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
