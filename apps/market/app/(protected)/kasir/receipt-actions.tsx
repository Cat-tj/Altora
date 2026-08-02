"use client";

import Link from "next/link";

export function ReceiptActions() {
  return <div className="market-receipt-actions"><button type="button" onClick={() => window.print()}>Cetak struk</button><Link href="/kasir">Transaksi baru</Link><Link href="/kasir/riwayat">Riwayat</Link></div>;
}
