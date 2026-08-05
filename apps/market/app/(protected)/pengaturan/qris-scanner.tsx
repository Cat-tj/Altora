"use client";

import { useRef, useState, useCallback } from "react";

export default function QrisScanner({
  initialPayload = "",
  onPayloadChange,
}: {
  initialPayload?: string;
  onPayloadChange?: (payload: string) => void;
}) {
  const [payload, setPayload] = useState(initialPayload);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const decodeQR = useCallback(async (file: File) => {
    setStatus("Membaca QR...");
    setPreview(URL.createObjectURL(file));

    try {
      // Dynamically import jsQR
      const jsQR = (await import("jsqr")).default;
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gagal load gambar"));
        img.src = URL.createObjectURL(file);
      });

      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code?.data) {
        setPayload(code.data);
        onPayloadChange?.(code.data);
        setStatus(`✅ QR terbaca! (${code.data.substring(0, 30)}...)`);
      } else {
        setStatus("❌ QR tidak terdeteksi. Coba foto lebih jelas.");
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    }
  }, [onPayloadChange]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) decodeQR(file);
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], "paste.png", { type });
            decodeQR(file);
            return;
          }
        }
      }
      setStatus("❌ Tidak ada gambar di clipboard.");
    } catch {
      setStatus("❌ Gagal akses clipboard.");
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: "none" }}
      />

      {/* Preview */}
      {preview && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.6rem", borderRadius: "10px",
          border: "1px solid var(--line)", background: "#fafafa",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="QR Preview"
            style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink)" }}>
              {status}
            </div>
            {payload && (
              <div style={{
                fontSize: "0.65rem", color: "var(--muted)",
                fontFamily: "var(--font-mono)", marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {payload.substring(0, 60)}...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1, height: 36, borderRadius: 8, border: "1px solid var(--accent)",
            background: "#fff", color: "var(--accent)", fontWeight: 700,
            fontSize: "0.75rem", cursor: "pointer",
          }}
        >
          📷 Scan / Upload QR
        </button>
        <button
          type="button"
          onClick={handlePaste}
          style={{
            height: 36, padding: "0 0.75rem", borderRadius: 8,
            border: "1px solid var(--line)", background: "#fff",
            color: "var(--ink-2)", fontWeight: 600, fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          📋 Paste
        </button>
      </div>

      {/* Hidden payload for form submission */}
      <input type="hidden" name="staticQrisPayload" value={payload} />

      {/* Manual override (collapsible) */}
      <details style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
        <summary style={{ cursor: "pointer" }}>Atau tempel string manual</summary>
        <textarea
          name="staticQrisPayload"
          rows={2}
          value={payload}
          onChange={(e) => {
            setPayload(e.target.value);
            onPayloadChange?.(e.target.value);
          }}
          placeholder="0002010102112657..."
          style={{
            width: "100%", marginTop: "0.4rem", padding: "0.5rem",
            borderRadius: 8, border: "1px solid var(--line)",
            fontSize: "0.7rem", fontFamily: "monospace",
          }}
        />
      </details>
    </div>
  );
}
