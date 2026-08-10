import React from "react";
import { QuantityControl } from "./quantity-control.js";
import { EmptyCart } from "./empty-cart.js";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface CartPanelProps {
  items: CartItem[];
  subtotal: number;
  discount?: number;
  total: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  isSubmitting?: boolean;
  currencySymbol?: string;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export function CartPanel({
  items,
  subtotal,
  discount = 0,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isSubmitting = false,
  currencySymbol = "Rp",
  headerSlot,
  footerSlot,
}: CartPanelProps) {
  const formatMoney = (val: number) => `${currencySymbol} ${val.toLocaleString("id-ID")}`;

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-sm">
      {headerSlot && <div className="p-4 border-b border-slate-100">{headerSlot}</div>}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 pr-3 min-w-0">
                <h4 className="text-sm font-medium text-slate-800 truncate">{item.name}</h4>
                <p className="text-xs text-slate-500">{formatMoney(item.price)}</p>
                {item.notes && <p className="text-xs italic text-slate-400">{item.notes}</p>}
              </div>

              <div className="flex items-center gap-3">
                <QuantityControl
                  quantity={item.quantity}
                  onIncrease={() => onUpdateQuantity(item.id, 1)}
                  onDecrease={() => onUpdateQuantity(item.id, -1)}
                />
                <div className="text-right min-w-[70px]">
                  <p className="text-sm font-bold text-slate-800">{formatMoney(item.subtotal)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-2">
        <div className="flex justify-between text-xs text-slate-600">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-xs text-emerald-600 font-medium">
            <span>Diskon</span>
            <span>-{formatMoney(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
          <span>Total Tagihan</span>
          <span>{formatMoney(total)}</span>
        </div>

        {footerSlot}

        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0 || isSubmitting}
          className="w-full mt-3 py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm shadow border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
        >
          {isSubmitting ? "Memproses..." : "Bayar Sekarang"}
        </button>
      </div>
    </div>
  );
}
