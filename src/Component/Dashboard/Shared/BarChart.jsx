import { useMemo } from "react";

function formatMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthlyBuckets(monthsBack) {
  const now = new Date();
  const buckets = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push(formatMonth(d));
  }
  return buckets;
}

function getNumericMs(value) {
  if (!value) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  try {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  } catch {
    return null;
  }
}

export default function BarChart({
  width = 600,
  height = 240,
  padding = 32,
  months = 12,
  title = "",
  subtitle = "",
  color = "#ec4899",
  items = [], // [{ createdAt, amount }]
  currency = "$",
}) {
  // Responsive sizing
  const isMobile = window.innerWidth < 768;
  const responsiveWidth = isMobile ? Math.min(width, window.innerWidth - 32) : width;
  const responsiveHeight = isMobile ? Math.min(height, 200) : height;
  const responsivePadding = isMobile ? 16 : padding;
  const buckets = useMemo(() => buildMonthlyBuckets(months), [months]);

  const series = useMemo(() => {
    const sums = Object.fromEntries(buckets.map((b) => [b, 0]));
    (items || []).forEach((it) => {
      const ms = getNumericMs(it?.createdAt);
      const amount = Number(it?.amount || 0);
      if (!ms || !Number.isFinite(amount)) return;
      const key = formatMonth(new Date(ms));
      if (key in sums) sums[key] += amount;
    });
    return buckets.map((b) => ({ x: b, y: sums[b] || 0 }));
  }, [items, buckets]);

  const domain = useMemo(() => {
    const maxY = Math.max(1, ...series.map((p) => p.y));
    return { minX: 0, maxX: series.length - 1, minY: 0, maxY };
  }, [series]);

  const innerW = responsiveWidth - responsivePadding * 2;
  const innerH = responsiveHeight - responsivePadding * 2;
  const barGap = 8;
  const barW = Math.max(6, (innerW / (series.length || 1)) - barGap);

  const yToPx = (y) => responsivePadding + innerH - (y / (domain.maxY || 1)) * innerH;

  const gridYs = useMemo(() => {
    const lines = 4;
    return new Array(lines + 1).fill(0).map((_, i) => (
      Math.round((domain.maxY * i) / lines)
    ));
  }, [domain.maxY]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <div className="text-sm text-gray-600">{title}</div>}
          {subtitle && <div className="text-xl font-semibold">{subtitle}</div>}
        </div>
      )}
      <svg width={responsiveWidth} height={responsiveHeight} role="img" className="w-full h-auto">
        {/* Grid */}
        {gridYs.map((gy, i) => {
          const yPx = yToPx(gy);
          return (
            <g key={`grid-${i}`}>
              <line x1={responsivePadding} y1={yPx} x2={responsiveWidth - responsivePadding} y2={yPx} stroke="#f0f0f0" />
              <text x={responsivePadding - 6} y={yPx} fontSize="10" textAnchor="end" fill="#9ca3af">{currency}{gy}</text>
            </g>
          );
        })}

        {/* X labels and bars */}
        {series.map((p, i) => {
          const x = responsivePadding + i * (barW + barGap);
          const y = yToPx(p.y);
          const h = responsivePadding + innerH - y;
          const label = p.x.split("-").slice(1).join("/");
          return (
            <g key={`bar-${i}`}>
              <rect x={x} y={y} width={barW} height={h} fill={color} rx={4} />
              <text x={x + barW / 2} y={responsiveHeight - 8} fontSize="10" textAnchor="middle" fill="#9ca3af">{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}


