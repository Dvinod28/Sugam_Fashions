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
  // Firestore Timestamp
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  try {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  } catch {
    return null;
  }
}

export default function AreaChart({
  width = 600,
  height = 260,
  padding = 32,
  months = 12,
  series = [],
  title = "",
  subtitle = "",
}) {
  // Responsive sizing
  const isMobile = window.innerWidth < 768;
  const responsiveWidth = isMobile ? Math.min(width, window.innerWidth - 32) : width;
  const responsiveHeight = isMobile ? Math.min(height, 200) : height;
  const responsivePadding = isMobile ? 16 : padding;
  const buckets = useMemo(() => buildMonthlyBuckets(months), [months]);

  const aggregated = useMemo(() => {
    return (series || []).map((s) => {
      const countsByMonth = Object.fromEntries(buckets.map((b) => [b, 0]));
      (s.items || []).forEach((item) => {
        const ms = getNumericMs(item.createdAt);
        if (!ms) return;
        const d = new Date(ms);
        const key = formatMonth(d);
        if (key in countsByMonth) countsByMonth[key] += 1;
      });
      const points = buckets.map((b) => ({ x: b, y: countsByMonth[b] || 0 }));
      return { name: s.name, color: s.color, points };
    });
  }, [series, buckets]);

  const domain = useMemo(() => {
    const maxY = Math.max(
      1,
      ...aggregated.flatMap((s) => s.points.map((p) => p.y))
    );
    return { minX: 0, maxX: buckets.length - 1, minY: 0, maxY };
  }, [aggregated, buckets.length]);

  const plot = (idx, y) => {
    const innerW = responsiveWidth - responsivePadding * 2;
    const innerH = responsiveHeight - responsivePadding * 2;
    const x = responsivePadding + (idx / domain.maxX) * innerW;
    const yPx = responsivePadding + innerH - (y / (domain.maxY || 1)) * innerH;
    return [x, yPx];
  };

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
          const [, yPx] = plot(0, gy);
          return (
            <g key={`grid-${i}`}>
              <line x1={responsivePadding} y1={yPx} x2={responsiveWidth - responsivePadding} y2={yPx} stroke="#f0f0f0" />
              <text x={responsivePadding - 6} y={yPx} fontSize="10" textAnchor="end" fill="#9ca3af">{gy}</text>
            </g>
          );
        })}

        {/* X labels */}
        {buckets.map((b, i) => {
          const [x] = plot(i, 0);
          const label = b.split("-").slice(1).join("/");
          return (
            <text key={`xl-${b}`} x={x} y={responsiveHeight - 8} fontSize="10" textAnchor="middle" fill="#9ca3af">{label}</text>
          );
        })}

        {/* Series */}
        {aggregated.map((s, si) => {
          const d = s.points.map((p, i) => {
            const [x, yPx] = plot(i, p.y);
            return `${i === 0 ? "M" : "L"}${x},${yPx}`;
          }).join(" ");

          const areaD = `${d} L ${responsiveWidth - responsivePadding},${responsiveHeight - responsivePadding} L ${responsivePadding},${responsiveHeight - responsivePadding} Z`;

          return (
            <g key={`s-${si}`}>
              <path d={areaD} fill={s.color + "20"} stroke="none" />
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" />
              {s.points.map((p, i) => {
                const [x, yPx] = plot(i, p.y);
                return <circle key={`pt-${si}-${i}`} cx={x} cy={yPx} r={3} fill={s.color} />
              })}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-3">
        {aggregated.map((s, i) => (
          <div key={`lg-${i}`} className="flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}


