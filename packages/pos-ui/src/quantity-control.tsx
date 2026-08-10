import React from "react";
import { Minus, Plus } from "lucide-react";

export interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max,
  disabled = false,
}: QuantityControlProps) {
  return (
    <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50 p-1">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-700 shadow-sm border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 active:scale-95 transition-all"
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-semibold text-slate-800">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || (max !== undefined && quantity >= max)}
        className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-700 shadow-sm border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 active:scale-95 transition-all"
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
