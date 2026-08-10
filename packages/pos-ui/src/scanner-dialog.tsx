import React from "react";
import { Camera, X } from "lucide-react";

export interface ScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  title?: string;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export function ScannerDialog({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan Barcode Produk",
  videoRef,
}: ScannerDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Camera className="w-4 h-4 text-slate-600" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef as React.RefObject<HTMLVideoElement>}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-lg pointer-events-none m-8 animate-pulse" />
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Arahkan kamera ke barcode produk. Pastikan cahaya cukup.
          </p>
        </div>
      </div>
    </div>
  );
}
