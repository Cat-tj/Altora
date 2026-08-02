import { notFound } from "next/navigation";
import { auth } from "../../../../../auth";
import { getMarketSale } from "../../../../../lib/market-pos";
import { ReceiptActions } from "../../receipt-actions";

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default async function ReceiptPage({ params }: { params: Promise<{ saleId: string }> }) {
  const { saleId } = await params; const user = (await auth())!.user as { tenantId: string }; const sale = await getMarketSale({ tenantId: user.tenantId, saleId }); if (!sale) notFound();
  return <section className="market-receipt-wrap" aria-labelledby="receipt-title"><article className="market-receipt"><header><p>Altora Market</p><h1 id="receipt-title">{sale.outletName}</h1><span>{sale.status === "VOIDED" ? "TRANSAKSI DIBATALKAN" : "Struk transaksi"}</span></header><dl><div><dt>No. transaksi</dt><dd>{sale.invoiceNumber}</dd></div><div><dt>Waktu</dt><dd>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(sale.createdAt)}</dd></div><div><dt>Kasir</dt><dd>{sale.cashierName}</dd></div></dl><ul>{sale.items.map((item) => <li key={item.id}><span>{item.productName}<small>{item.qty} × {money(item.price)}</small></span><strong>{money(item.subtotal)}</strong></li>)}</ul><dl className="market-receipt-total"><div><dt>Total</dt><dd>{money(sale.total)}</dd></div><div><dt>{sale.paymentMethod}</dt><dd>{money(sale.amountPaid)}</dd></div>{sale.changeAmount ? <div><dt>Kembalian</dt><dd>{money(sale.changeAmount)}</dd></div> : null}</dl>{sale.voidReason ? <p className="market-form-error">Dibatalkan: {sale.voidReason}</p> : null}</article><ReceiptActions /></section>;
}
