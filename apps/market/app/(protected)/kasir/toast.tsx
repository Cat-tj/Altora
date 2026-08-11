"use client";
import { useEffect, useState } from "react";

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);
  return { toastMessage: msg, showToast: (m: string) => setMsg(m) };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all"
      style={{ backgroundColor: "var(--color-text, #0a1f44)" }}
    >
      {message}
    </div>
  );
}
