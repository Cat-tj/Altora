"use client";

import { useState } from "react";

export default function TransferStokButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: ".4rem",
          height: 36, padding: "0 .9rem", borderRadius: 8,
          background: "var(--accent)", color: "#fff",
          fontWeight: 700, fontSize: ".78rem", border: "none", cursor: "pointer",
        }}
      >
        + Transfer Baru
      </button>
      {open && <TransferFormModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

// Lazy import the modal component
import TransferFormModal from "./transfer-form-modal";
