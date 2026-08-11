export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseRupiah(text: string): number {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
