import React from "react";
import { ShoppingCart } from "lucide-react";

export interface EmptyCartProps {
  title?: string;
  description?: string;
}

export function EmptyCart({
  title = "Keranjang Kosong",
  description = "Pilih produk atau scan barcode untuk menambahkan barang ke keranjang kasir.",
}: EmptyCartProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
        <ShoppingCart className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs">{description}</p>
    </div>
  );
}
