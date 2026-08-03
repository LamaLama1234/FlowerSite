"use client";

import { useRef, useState } from "react";

import { useOrderAnalytics } from "@/hooks/useOrderAnalytics";
import { formatPrice } from "@/utils/product";
import { getOrderStatusMeta } from "@/utils/order";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PADDING = { top: 12, right: 12, bottom: 28, left: 52 };
const INNER_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

const shortDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}М`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}К`;
  return String(value);
}

export function AdminAnalytics() {
  const { data, isLoading } = useOrderAnalytics();

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const { summary, revenueByDay, ordersByStatus, topProducts } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Выручка за 30 дней" value={formatPrice(summary.totalRevenue)} />
        <StatTile label="Заказов за 30 дней" value={String(summary.totalOrders)} />
        <StatTile
          label="Средний чек"
          value={formatPrice(summary.averageOrderValue)}
        />
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-primary mb-4 text-sm font-semibold">
          Выручка по дням (30 дней)
        </h3>
        <RevenueChart data={revenueByDay} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-primary mb-4 text-sm font-semibold">
            Топ товаров по выручке
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Пока нет данных</p>
          ) : (
            <BarList
              items={topProducts.map((p) => ({
                key: p.productId,
                label: p.title,
                value: p.revenue,
                valueLabel: formatPrice(p.revenue),
              }))}
              barClassName="bg-primary"
            />
          )}
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-primary mb-4 text-sm font-semibold">
            Заказы по статусам
          </h3>
          {ordersByStatus.length === 0 ? (
            <p className="text-muted-foreground text-sm">Пока нет данных</p>
          ) : (
            <BarList
              items={ordersByStatus.map((s) => ({
                key: s.status,
                label: getOrderStatusMeta(s.status).label,
                value: s.count,
                valueLabel: String(s.count),
              }))}
              barClassName="bg-gold-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function BarList({
  items,
  barClassName,
}: {
  items: { key: string; label: string; value: number; valueLabel: string }[];
  barClassName: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{item.label}</span>
            <span className="text-muted-foreground shrink-0 pl-2 font-medium">
              {item.valueLabel}
            </span>
          </div>
          {/* 2px surface gap вокруг закруглённого конца — трек чуть светлее заливки. */}
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full ${barClassName}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const points = data.map((d, i) => {
    const x =
      PADDING.left + (data.length > 1 ? (i / (data.length - 1)) * INNER_WIDTH : 0);
    const y = PADDING.top + INNER_HEIGHT - (d.revenue / maxRevenue) * INNER_HEIGHT;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const baseline = PADDING.top + INNER_HEIGHT;
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
      : "";

  const gridSteps = [0, 0.33, 0.66, 1];

  function handleMove(event: React.MouseEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg || data.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const x = ratio * CHART_WIDTH;
    const relative = (x - PADDING.left) / (INNER_WIDTH || 1);
    const index = Math.round(relative * (data.length - 1));
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Выручка по дням за последние 30 дней"
      >
        {gridSteps.map((step) => {
          const y = PADDING.top + INNER_HEIGHT - step * INNER_HEIGHT;
          return (
            <g key={step}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {compactNumber(Math.round(maxRevenue * step))}
              </text>
            </g>
          );
        })}

        {data.length > 0 && (
          <>
            <text
              x={points[0].x}
              y={CHART_HEIGHT - 8}
              textAnchor="start"
              className="fill-muted-foreground text-[9px]"
            >
              {shortDate.format(new Date(data[0].date))}
            </text>
            <text
              x={points[points.length - 1].x}
              y={CHART_HEIGHT - 8}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {shortDate.format(new Date(data[data.length - 1].date))}
            </text>
          </>
        )}

        <path d={areaPath} className="fill-primary" fillOpacity={0.1} />
        <path
          d={linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING.top}
              y2={baseline}
              className="stroke-border"
              strokeWidth={1}
            />
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r={4}
              className="fill-primary stroke-card"
              strokeWidth={2}
            />
          </>
        )}

        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={INNER_WIDTH}
          height={INNER_HEIGHT}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          className="border-gold-200/50 bg-card pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(hovered.x / CHART_WIDTH) * 100}%`,
            top: `${(hovered.y / CHART_HEIGHT) * 100}%`,
          }}
        >
          <div className="font-medium">{formatPrice(hovered.revenue)}</div>
          <div className="text-muted-foreground">
            {shortDate.format(new Date(hovered.date))}
          </div>
        </div>
      )}
    </div>
  );
}
