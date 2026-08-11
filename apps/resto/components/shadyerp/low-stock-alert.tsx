export function LowStockAlert({ items = [] }: { items?: Array<{ productName: string; currentStock: number; reorderPoint: number }> }) {
  if (!items.length) return null;
  return <aside className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">Stok menipis: {items.map((item) => item.productName).join(", ")}</aside>;
}
