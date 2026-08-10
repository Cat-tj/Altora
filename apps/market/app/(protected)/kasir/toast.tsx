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
      className="fixed top-6 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-2xl transition-all"
      style={{
        backgroundColor: "#0f172a",
        color: "#ffffff",
        border: "1.5px solid #334155",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <span>{message}</span>
    </div>
  );
}
