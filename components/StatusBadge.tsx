"use client";

import { Check, CircleDot, Wrench } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "Selesai":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-800 whitespace-nowrap shrink-0">
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Selesai</span>
        </span>
      );
    case "Dalam Tindakan":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 whitespace-nowrap shrink-0">
          <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Dalam Tindakan</span>
        </span>
      );
    case "Baru":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0">
          <CircleDot className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Baru</span>
        </span>
      );
  }
}
