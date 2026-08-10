"use client";

import { useState } from "react";
import { PosShell } from "@altora/pos-ui/pos-shell";
import { CartPanel } from "@altora/pos-ui/cart-panel";
import { Scissors, UserCheck, Sparkles, ShoppingBag } from "lucide-react";
import type { ServiceCatalogItem, ServiceStaff } from "../lib/service-db";

export function ServicePosClient({ catalog, staff }: { catalog: ServiceCatalogItem[]; staff: ServiceStaff[] }) {
  const [cart, setCart] = useState<Array<ServiceCatalogItem & { quantity: number; subtotal: number; assignedStaffId?: string }>>([]);
  const [selectedStaff, setSelectedStaff] = useState(staff[0]?.id ?? "");
  const [status, setStatus] = useState("");

  const add = (item: ServiceCatalogItem) => setCart((prev) => {
    const existing = prev.find((x) => x.id === item.id);
    if (existing) return prev.map((x) => x.id === item.id ? { ...x, quantity: x.quantity + 1, subtotal: (x.quantity + 1) * x.price } : x);
    return [...prev, { ...item, quantity: 1, subtotal: item.price, assignedStaffId: item.itemType === "SERVICE" ? selectedStaff : undefined }];
  });
  const update = (id: string, delta: number) => setCart((prev) => prev.flatMap((x) => {
    if (x.id !== id) return [x];
    const quantity = x.quantity + delta;
    return quantity > 0 ? [{ ...x, quantity, subtotal: quantity * x.price }] : [];
  }));
  const total = cart.reduce((sum, x) => sum + x.subtotal, 0);
  const checkout = async () => {
    if (!cart.length) return;
    setStatus("Transaksi sedang diproses…");
    const response = await fetch("/api/service/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ staffId: selectedStaff || undefined, paymentMethod: "CASH", requestId: crypto.randomUUID(), items: cart.map((x) => ({ catalogItemId: x.id, quantity: x.quantity })) }) });
    const result = await response.json();
    setStatus(response.ok ? `Transaksi tersimpan: ${result.id}` : result.error ?? "Checkout gagal");
    if (response.ok) setCart([]);
  };

  return <PosShell
    headerSlot={<div className="flex items-center justify-between px-6 h-full bg-slate-900 text-white"><div className="flex items-center gap-3"><Scissors className="w-5 h-5 text-indigo-400" /><h1 className="font-bold text-base tracking-wide">Altora Service — Kasir Jasa</h1></div><label className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs"><UserCheck className="w-4 h-4 text-emerald-400" /> Staf Aktif:<select aria-label="Staf aktif" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="bg-transparent font-medium text-white focus:outline-none cursor-pointer">{staff.map((s) => <option key={s.id} value={s.id} className="bg-slate-800 text-white">{s.name}</option>)}</select></label></div>}
    catalogSlot={<div className="space-y-4"><h2 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" />Katalog Layanan & Produk</h2><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{catalog.map((item) => <button key={item.id} type="button" onClick={() => add(item)} className="flex flex-col justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md text-left"><div><span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">{item.category}</span><h3 className="font-semibold text-sm text-slate-800 mt-2">{item.name}</h3></div><div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between"><span className="font-bold text-sm">Rp {item.price.toLocaleString("id-ID")}</span><span className="text-xs font-medium text-indigo-600">+ Tambah</span></div></button>)}</div></div>}
    cartSlot={<div><CartPanel items={cart} subtotal={total} total={total} onUpdateQuantity={update} onRemoveItem={(id) => { const item = cart.find((x) => x.id === id); if (item) update(id, -item.quantity); }} onCheckout={checkout} />{status && <p role="status" className="mt-3 text-xs text-slate-600">{status}</p>}</div>}
  />;
}
