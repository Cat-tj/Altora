"use client";

import { useState } from "react";
import type { SalesTrendPoint } from "../../../../lib/market-dashboard";
import { formatRupiah } from "../../market-page-ui";

export function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const totalOmzet = data.reduce((acc, curr) => acc + curr.omzet, 0);
  const totalTransactions = data.reduce((acc, curr) => acc + curr.transactions, 0);
  const avgOmzet = Math.round(totalOmzet / Math.max(data.length, 1));

  // Determine max value for scale
  const rawMax = Math.max(...data.map((d) => d.omzet), 100000);
  // Round max up to nice step
  const maxOmzet = Math.ceil(rawMax / 100000) * 100000 || 100000;
  const midOmzet = Math.round(maxOmzet / 2);

  // SVG viewport specs
  const width = 680;
  const height = 190;
  const paddingLeft = 85;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((item, i) => {
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const ratio = item.omzet / maxOmzet;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { x, y, item, i };
  });

  // Construct SVG line path (smooth spline or polyline)
  const linePath = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1]!;
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  // Area path below line
  const firstPt = points[0]!;
  const lastPt = points[points.length - 1]!;
  const bottomY = paddingTop + chartHeight;
  const areaPath = `${linePath} L ${lastPt.x} ${bottomY} L ${firstPt.x} ${bottomY} Z`;

  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div className="market-chart-card">
      <div className="market-chart-header">
        <div>
          <h2>Tren Penjualan</h2>
          <p>Grafik omzet harian 7 hari terakhir</p>
        </div>
        {activePoint && (
          <div className="market-chart-tooltip">
            <strong>{activePoint.item.date}</strong>: {formatRupiah(activePoint.item.omzet)} ({activePoint.item.transactions} transaksi)
          </div>
        )}
      </div>

      <div className="market-chart-svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="market-chart-svg">
          <defs>
            <linearGradient id="marketTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent, #7C5CE8)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent, #7C5CE8)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {[
            { value: maxOmzet, y: paddingTop },
            { value: midOmzet, y: paddingTop + chartHeight / 2 },
            { value: 0, y: paddingTop + chartHeight },
          ].map((grid) => (
            <g key={grid.y}>
              <line
                x1={paddingLeft}
                y1={grid.y}
                x2={width - paddingRight}
                y2={grid.y}
                stroke="var(--line-2, #e9e6f2)"
                strokeDasharray={grid.value === 0 ? undefined : "3 3"}
              />
              <text
                x={paddingLeft - 10}
                y={grid.y + 4}
                textAnchor="end"
                className="market-chart-label"
              >
                {grid.value >= 1000000
                  ? `Rp ${(grid.value / 1000000).toFixed(1)}M`
                  : grid.value >= 1000
                  ? `Rp ${(grid.value / 1000).toFixed(0)}k`
                  : "Rp 0"}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#marketTrendGradient)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent, #7C5CE8)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & X labels */}
          {points.map((pt) => {
            const isActive = activeIndex === pt.i;
            return (
              <g key={pt.i} className="market-chart-point-group">
                {/* Vertical hover line */}
                {isActive && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={bottomY}
                    stroke="var(--accent, #7C5CE8)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 6.5 : 4.5}
                  fill="#ffffff"
                  stroke="var(--accent, #7C5CE8)"
                  strokeWidth={isActive ? "3.5" : "2.5"}
                  className="market-chart-circle"
                  onMouseEnter={() => setActiveIndex(pt.i)}
                  onMouseLeave={() => setActiveIndex(null)}
                />

                {/* Hit area for easier hover */}
                <rect
                  x={pt.x - 20}
                  y={paddingTop}
                  width="40"
                  height={chartHeight + paddingBottom}
                  fill="transparent"
                  onMouseEnter={() => setActiveIndex(pt.i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  style={{ cursor: "pointer" }}
                />

                {/* X-axis date label */}
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={`market-chart-date-label ${isActive ? "is-active" : ""}`}
                >
                  {pt.item.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary Footer */}
      <div className="market-chart-summary">
        <div className="market-chart-summary-item">
          <span>Total Omzet 7 Hari</span>
          <strong>{formatRupiah(totalOmzet)}</strong>
        </div>
        <div className="market-chart-summary-item">
          <span>Total Transaksi</span>
          <strong>{totalTransactions} Transaksi</strong>
        </div>
        <div className="market-chart-summary-item">
          <span>Rata-rata Harian</span>
          <strong>{formatRupiah(avgOmzet)}</strong>
        </div>
      </div>
    </div>
  );
}
