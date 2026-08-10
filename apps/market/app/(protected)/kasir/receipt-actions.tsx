"use client";

import Link from "next/link";

function printReceipt(width: "58mm" | "80mm") {
  document.body.classList.remove("thermal-58mm", "thermal-80mm");
  document.body.classList.add(width === "58mm" ? "thermal-58mm" : "thermal-80mm");
  const style = document.createElement("style");
  style.id = "thermal-page-size";
  style.textContent = `@media print { @page { size: ${width} auto; } }`;
  document.head.appendChild(style);
  window.print();
  window.setTimeout(() => { style.remove(); document.body.classList.remove("thermal-58mm", "thermal-80mm"); }, 1000);
}

export function ReceiptPrintButtons() {
  return <div className="market-receipt-actions"><button type="button" onClick={() => printReceipt("58mm")}>Cetak Struk 58mm</button><button type="button" onClick={() => printReceipt("80mm")}>Cetak Struk 80mm</button><button type="button" onClick={() => { const saved = window.localStorage.getItem("altora-receipt-width"); printReceipt(saved === "58mm" ? "58mm" : "80mm"); }}>Cetak struk</button><Link href="/kasir">Transaksi baru</Link><Link href="/kasir/riwayat">Riwayat</Link></div>;
}

export const ReceiptActions = ReceiptPrintButtons;
export { printReceipt };