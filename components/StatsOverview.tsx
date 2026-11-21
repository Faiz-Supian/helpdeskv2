"use client";

import type { AduanRecord } from "@/lib/aduan";

interface StatsOverviewProps {
  records: AduanRecord[];
  isLoading: boolean;
}

export function StatsOverview({ records, isLoading }: StatsOverviewProps) {
  const total = records.length;
  const baruCount = records.filter((r) => r.status === "Baru").length;
  const inProgressCount = records.filter(
    (r) => r.status === "Dalam Tindakan"
  ).length;
  const openCount = baruCount + inProgressCount;
  const resolvedCount = records.filter((r) => r.status === "Selesai").length;
  const criticalOpenCount = records.filter(
    (r) => r.status !== "Selesai" && r.tahap_keutamaan === "Kritikal"
  ).length;

  const resolvedRate =
    total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const cards = [
    {
      label: "Aduan Terbuka",
      value: openCount,
      detail: `${baruCount} Baru · ${inProgressCount} Dalam Tindakan`,
      tone: "text-slate-900",
    },
    {
      label: "Aduan Selesai",
      value: resolvedCount,
      detail: `${resolvedRate}% kadar penyelesaian`,
      tone: "text-emerald-700",
    },
    {
      label: "Jumlah Aduan",
      value: total,
      detail: "Keseluruhan rekod berdaftar",
      tone: "text-slate-900",
    },
    {
      label: "Kritikal Terbuka",
      value: criticalOpenCount,
      detail:
        criticalOpenCount > 0
          ? "Memerlukan tindakan segera"
          : "Tiada kes kritikal aktif",
      tone: criticalOpenCount > 0 ? "text-red-700" : "text-slate-900",
    },
  ];

  return (
    <section
      id="ringkasan"
      aria-label="Ringkasan statistik aduan"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <p className="text-xs font-medium text-slate-500">{card.label}</p>
          {isLoading ? (
            <div className="mt-2.5 h-8 w-16 animate-pulse rounded bg-slate-100" />
          ) : (
            <p
              className={`mt-1.5 font-mono text-3xl font-semibold tracking-tight tabular-nums ${card.tone}`}
            >
              {card.value}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">{card.detail}</p>
        </div>
      ))}
    </section>
  );
}
