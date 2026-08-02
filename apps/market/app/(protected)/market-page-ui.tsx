import Link from "next/link";

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export function EmptyMarketState({ title, description, action }: { title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="market-empty-state"><strong>{title}</strong><p>{description}</p>{action && <Link href={action.href}>{action.label}</Link>}</div>;
}
