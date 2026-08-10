"use client";

import { useState } from "react";
import type { SalesTrendPoint } from "../../../../lib/market-dashboard";
import { formatRupiah } from "../../market-page-ui";

export function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [period, setPeriod] = useState<"7" | "30">("7");

  if (!data || data.length === 0) return null;

  // For now period selector is cosmetic (data always 7 days from server)
  const visibleData = data;

  const totalOmzet = visibleData.reduce((acc, curr) => acc + curr.omzet, 0);
  const totalTransactions = visibleData.reduce((acc, curr) => acc + curr.transactions, 0);
  const avgOmzet = Math.round(totalOmzet / Math.max(visibleData.length, 1));

  // Scale
  const rawMax = Math.max(...visibleData.map((d) => d.omzet), 100000);
  const maxOmzet = Math.ceil(rawMax / 100000) * 100000 || 100000;

  // SVG viewBox
  const width = 800;
  const height = 180;
  const paddingLeft = 75;
  const paddingRight = 12;
  const paddingTop = 24;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = visibleData.map((item, i) => {
    const x = paddingLeft + (i / Math.max(visibleData.length - 1, 1)) * chartWidth;
    const ratio = item.omzet / maxOmzet;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { x, y, item, i };
  });

  const linePath = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1]!;
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  const firstPt = points[0]!;
  const lastPt = points[points.length - 1]!;
  const bottomY = paddingTop + chartHeight;
  const areaPath = `${linePath} L ${lastPt.x} ${bottomY} L ${firstPt.x} ${bottomY} Z`;

  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  const yTicks = [maxOmzet, Math.round(maxOmzet / 2), 0];

  function formatShortDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  return (
    <div className="market-chart-card op-chart-card">
      {/* Header */}
      <div className="market-chart-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>
            Tren Penjualan
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
            Grafik omzet harian
          </p>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {(["7", "30"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              type="button"
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: 700,
                border: "1px solid",
                borderColor: period === p ? "var(--accent, #0d9488)" : "var(--line, #EAECF0)",
                background: period === p ? "var(--accent, #0d9488)" : "transparent",
                color: period === p ? "#fff" : "var(--muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {p} Hari
            </button>
          ))}
        </div>
        {activePoint && (
          <div className="market-chart-tooltip" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <strong>{activePoint.item.date}</strong>: {formatRupiah(activePoint.item.omzet)}
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="market-chart-svg-wrap" style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", minHeight: "140px", maxHeight: "190px", display: "block" }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="opTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent, #0d9488)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent, #0d9488)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y grid lines */}
          {yTicks.map((tick, ti) => {
            const yPos = paddingTop + chartHeight - (tick / maxOmzet) * chartHeight;
            return (
              <g key={ti}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={width - paddingRight}
                  y2={yPos}
                  stroke="#EAECF0"
                  strokeWidth="0.8"
                  strokeDasharray={ti > 0 ? "4 4" : ""}
                />
                <text
                  x={paddingLeft - 4}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {tick >= 1000000 ? `${(tick / 1000000).toFixed(1)}M` : tick >= 1000 ? `${Math.round(tick / 1000)}k` : tick.toString()}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#opTrendGrad)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="var(--accent, #0d9488)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* X-axis date labels */}
          {points.map((pt) => (
            <text
              key={pt.i}
              x={pt.x}
              y={height - 6}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
            >
              {formatShortDate(pt.item.date)}
            </text>
          ))}

          {/* Interactive hit areas + dots */}
          {points.map((pt) => (
            <g key={pt.i} onMouseEnter={() => setActiveIndex(pt.i)}>
              <rect
                x={pt.x - (chartWidth / visibleData.length) / 2}
                y={paddingTop}
                width={chartWidth / visibleData.length}
                height={chartHeight}
                fill="transparent"
              />
              {activeIndex === pt.i && (
                <>
                  <line x1={pt.x} y1={paddingTop} x2={pt.x} y2={bottomY} stroke="#EAECF0" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={pt.x} cy={pt.y} r="4" fill="var(--accent, #0d9488)" stroke="#fff" strokeWidth="2" />
                </>
              )}
              {pt.item.omzet > 0 && activeIndex !== pt.i && (
                <circle cx={pt.x} cy={pt.y} r="2.5" fill="var(--accent, #0d9488)" opacity="0.6" />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Summary row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        paddingTop: "10px",
        borderTop: "1px solid var(--line, #EAECF0)",
        marginTop: "4px",
      }}>
        {[
          { label: "Total Omzet", value: formatRupiah(totalOmzet) },
          { label: "Total Transaksi", value: String(totalTransactions) },
          { label: "Rata-rata Harian", value: formatRupiah(avgOmzet) },
        ].map((m) => (
          <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 600 }}>{m.label}</span>
            <strong style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{m.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
