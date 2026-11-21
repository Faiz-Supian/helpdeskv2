"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Database,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  KATEGORI_OPTIONS,
  KEUTAMAAN_OPTIONS,
  type AduanRecord,
  type StatusAduan,
} from "@/lib/aduan";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { StatsOverview } from "@/components/StatsOverview";
import { AduanFormModal } from "@/components/AduanFormModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ToastContainer, type ToastItem } from "@/components/ToastContainer";

type StatusFilter = "Semua" | "Terbuka" | StatusAduan;

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function HelpdeskDashboard() {
  const [records, setRecords] = useState<AduanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [priorityFilter, setPriorityFilter] = useState<string>("Semua");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");

  const [updatingIds, setUpdatingIds] = useState<Record<number, boolean>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<AduanRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AduanRecord | null>(
    null
  );

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback(
    (type: "success" | "error", title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const fetchAduan = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const res = await fetch("/api/aduan", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "Gagal memuatkan data aduan."
        );
      }

      setRecords(Array.isArray(json.data) ? (json.data as AduanRecord[]) : []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Tidak dapat berhubung dengan pelayan.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/aduan", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          throw new Error(
            typeof json.error === "string"
              ? json.error
              : "Gagal memuatkan data aduan."
          );
        }

        setRecords(Array.isArray(json.data) ? (json.data as AduanRecord[]) : []);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error
            ? err.message
            : "Tidak dapat berhubung dengan pelayan.";
        setLoadError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records.filter((item) => {
      if (query && !item.lokasi.toLowerCase().includes(query)) {
        return false;
      }

      if (statusFilter === "Terbuka") {
        if (item.status !== "Baru" && item.status !== "Dalam Tindakan") {
          return false;
        }
      } else if (statusFilter !== "Semua" && item.status !== statusFilter) {
        return false;
      }

      if (
        priorityFilter !== "Semua" &&
        item.tahap_keutamaan !== priorityFilter
      ) {
        return false;
      }

      if (
        categoryFilter !== "Semua" &&
        item.kategori_kerosakan !== categoryFilter
      ) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: AduanRecord) => {
    setFormMode("edit");
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (
    savedRecord: AduanRecord,
    mode: "create" | "edit"
  ) => {
    if (mode === "create") {
      setRecords((prev) => [savedRecord, ...prev]);
      pushToast(
        "success",
        "Aduan baharu berjaya direkodkan",
        `${savedRecord.lokasi} · Keutamaan ${savedRecord.tahap_keutamaan}`
      );
    } else {
      setRecords((prev) =>
        prev.map((item) => (item.id === savedRecord.id ? savedRecord : item))
      );
      pushToast(
        "success",
        `Aduan #${String(savedRecord.id).padStart(3, "0")} dikemas kini`,
        `${savedRecord.lokasi} · Status ${savedRecord.status}`
      );
    }
  };

  const handleQuickAdvance = async (
    record: AduanRecord,
    nextStatus: StatusAduan
  ) => {
    setUpdatingIds((prev) => ({ ...prev, [record.id]: true }));
    try {
      const res = await fetch(`/api/aduan/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "Gagal mengemas kini status aduan."
        );
      }

      const updated = json.data as AduanRecord;
      setRecords((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      pushToast(
        "success",
        `Status dikemas kini ke "${updated.status}"`,
        `#${String(updated.id).padStart(3, "0")} · ${updated.lokasi}`
      );
    } catch (err) {
      pushToast(
        "error",
        "Kemas kini status gagal",
        err instanceof Error ? err.message : "Sila cuba lagi."
      );
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [record.id]: false }));
    }
  };

  const handleConfirmDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/aduan/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "Gagal memadam rekod aduan."
        );
      }

      setRecords((prev) => prev.filter((item) => item.id !== id));
      setDeletingRecord(null);
      pushToast(
        "success",
        `Aduan #${String(id).padStart(3, "0")} dipadam`,
        "Rekod telah dikeluarkan daripada senarai."
      );
    } catch (err) {
      pushToast(
        "error",
        "Gagal memadam aduan",
        err instanceof Error ? err.message : "Sila cuba lagi."
      );
    }
  };

  const handleNavFilter = (filter: StatusFilter) => {
    setStatusFilter(filter);
    const el = document.getElementById("senarai-aduan");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("Semua");
    setPriorityFilter("Semua");
    setCategoryFilter("Semua");
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "Semua" ||
    priorityFilter !== "Semua" ||
    categoryFilter !== "Semua";

  const statusTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: "Semua", label: "Semua", count: records.length },
    {
      value: "Terbuka",
      label: "Terbuka",
      count: records.filter(
        (r) => r.status === "Baru" || r.status === "Dalam Tindakan"
      ).length,
    },
    {
      value: "Baru",
      label: "Baru",
      count: records.filter((r) => r.status === "Baru").length,
    },
    {
      value: "Dalam Tindakan",
      label: "Dalam Tindakan",
      count: records.filter((r) => r.status === "Dalam Tindakan").length,
    },
    {
      value: "Selesai",
      label: "Selesai",
      count: records.filter((r) => r.status === "Selesai").length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <a
            href="#top"
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 sm:text-lg"
          >
            Facility Damage Helpdesk
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex"
          >
            <a
              href="#ringkasan"
              className="transition-colors hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              Ringkasan
            </a>
            <button
              type="button"
              onClick={() => handleNavFilter("Semua")}
              className={`transition-colors hover:text-slate-900 whitespace-nowrap shrink-0 ${
                statusFilter === "Semua" ? "font-semibold text-slate-900" : ""
              }`}
            >
              Semua Aduan
            </button>
            <button
              type="button"
              onClick={() => handleNavFilter("Terbuka")}
              className={`transition-colors hover:text-slate-900 whitespace-nowrap shrink-0 ${
                statusFilter === "Terbuka" ? "font-semibold text-slate-900" : ""
              }`}
            >
              Aduan Terbuka
            </button>
            <button
              type="button"
              onClick={() => handleNavFilter("Selesai")}
              className={`transition-colors hover:text-slate-900 whitespace-nowrap shrink-0 ${
                statusFilter === "Selesai" ? "font-semibold text-slate-900" : ""
              }`}
            >
              Selesai
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0 sm:text-sm"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Lapor Kerosakan</span>
            </button>
          </div>
        </div>
      </header>

      <main
        id="top"
        className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Sistem Aduan Kerosakan Fasiliti · Operasi Penyelenggaraan
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Papan Pemuka Aduan Fasiliti
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
              Pantau laporan kerosakan penyaman udara, elektrik, rangkaian Wi-Fi,
              paip air, dan perabot mengikut lokasi bangunan secara terus.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchAduan(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap sm:self-auto"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>Muat Semula</span>
          </button>
        </div>

        <StatsOverview records={records} isLoading={isLoading} />

        {loadError && (
          <div
            role="alert"
            className="flex flex-col gap-4 rounded-xl border border-red-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
                <Database className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Sambungan Pangkalan Data Tidak Tersedia
                </h2>
                <p className="mt-1 text-xs text-slate-600">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchAduan(true)}
              className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 whitespace-nowrap sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cuba Semula</span>
            </button>
          </div>
        )}

        <section
          id="senarai-aduan"
          aria-label="Senarai aduan kerosakan"
          className="rounded-xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 lg:max-w-md">
                <label htmlFor="search-lokasi" className="sr-only">
                  Cari aduan mengikut lokasi atau nama bilik
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="search-lokasi"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari mengikut lokasi atau bilik (cth. Blok A, Makmal)..."
                  className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 pr-9 pl-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Padam carian lokasi"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  aria-label="Tapis mengikut keutamaan"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="min-h-[42px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-none sm:text-sm"
                >
                  <option value="Semua">Semua Keutamaan</option>
                  {KEUTAMAAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Tapis mengikut kategori kerosakan"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="min-h-[42px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-none sm:text-sm"
                >
                  <option value="Semua">Semua Kategori</option>
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                role="tablist"
                aria-label="Penapis status aduan"
                className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1"
              >
                {statusTabs.map((tab) => {
                  const isActive = statusFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setStatusFilter(tab.value)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          isActive ? "text-slate-700" : "text-slate-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 tabular-nums">
                Menunjukkan{" "}
                <span className="font-semibold text-slate-900">
                  {filteredRecords.length}
                </span>{" "}
                daripada{" "}
                <span className="font-semibold text-slate-900">
                  {records.length}
                </span>{" "}
                aduan
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-72 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="hidden gap-3 sm:flex">
                    <div className="h-6 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-6 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-8 w-28 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {hasActiveFilters
                  ? "Tiada aduan sepadan dengan carian anda"
                  : "Belum ada rekod aduan fasiliti"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {hasActiveFilters
                  ? "Cuba ubah kata kunci lokasi atau tetapkan semula penapis untuk melihat semua rekod."
                  : "Rekod kerosakan yang dilaporkan oleh pelajar atau staf akan dipaparkan di sini."}
              </p>
              <div className="mt-5 flex items-center gap-3">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                  >
                    Set Semula Penapis
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Lapor Kerosakan Pertama</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                      <th className="py-3 pr-3 pl-5 font-semibold">ID</th>
                      <th className="px-3 py-3 font-semibold">
                        Lokasi &amp; Butiran
                      </th>
                      <th className="px-3 py-3 font-semibold">Kategori</th>
                      <th className="px-3 py-3 font-semibold">Keutamaan</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="py-3 pr-5 pl-3 text-right font-semibold">
                        Tindakan Pantas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRecords.map((item) => {
                      const isRowUpdating = Boolean(updatingIds[item.id]);
                      return (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <td className="py-3.5 pr-3 pl-5 align-middle font-mono text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
                            #{String(item.id).padStart(3, "0")}
                          </td>
                          <td className="px-3 py-3.5 align-middle">
                            <p className="font-semibold text-slate-900">
                              {item.lokasi}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span>{item.pengadu}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-[11px] tabular-nums">
                                {formatDateTime(item.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 align-middle text-xs font-medium text-slate-700 whitespace-nowrap">
                            {item.kategori_kerosakan}
                          </td>
                          <td className="px-3 py-3.5 align-middle">
                            <PriorityBadge priority={item.tahap_keutamaan} />
                          </td>
                          <td className="px-3 py-3.5 align-middle">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="py-3.5 pr-5 pl-3 align-middle">
                            <div className="flex items-center justify-end gap-2">
                              {item.status === "Baru" && (
                                <button
                                  type="button"
                                  disabled={isRowUpdating}
                                  onClick={() =>
                                    handleQuickAdvance(item, "Dalam Tindakan")
                                  }
                                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60 whitespace-nowrap"
                                >
                                  {isRowUpdating ? (
                                    <Loader2
                                      className="h-3.5 w-3.5 animate-spin"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <ArrowRight
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span>Mula Tindakan</span>
                                </button>
                              )}

                              {item.status === "Dalam Tindakan" && (
                                <button
                                  type="button"
                                  disabled={isRowUpdating}
                                  onClick={() =>
                                    handleQuickAdvance(item, "Selesai")
                                  }
                                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 whitespace-nowrap"
                                >
                                  {isRowUpdating ? (
                                    <Loader2
                                      className="h-3.5 w-3.5 animate-spin"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Check
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span>Tandakan Selesai</span>
                                </button>
                              )}

                              {item.status === "Selesai" && (
                                <span className="inline-flex min-h-[34px] items-center px-2 text-xs font-medium text-slate-400 whitespace-nowrap">
                                  Lengkap
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                aria-label={`Edit aduan #${item.id}`}
                                title="Edit aduan"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                              >
                                <Pencil
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingRecord(item)}
                                aria-label={`Padam aduan #${item.id}`}
                                title="Padam aduan"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredRecords.map((item) => {
                  const isRowUpdating = Boolean(updatingIds[item.id]);
                  return (
                    <div key={item.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono font-medium tabular-nums">
                              #{String(item.id).padStart(3, "0")}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{item.kategori_kerosakan}</span>
                          </div>
                          <h3 className="mt-1 text-sm font-semibold text-slate-900">
                            {item.lokasi}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.pengadu} · {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                        <PriorityBadge priority={item.tahap_keutamaan} />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <StatusBadge status={item.status} />

                        <div className="flex items-center gap-2">
                          {item.status === "Baru" && (
                            <button
                              type="button"
                              disabled={isRowUpdating}
                              onClick={() =>
                                handleQuickAdvance(item, "Dalam Tindakan")
                              }
                              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60 whitespace-nowrap"
                            >
                              {isRowUpdating ? (
                                <Loader2
                                  className="h-3.5 w-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ArrowRight
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                              <span>Mula Tindakan</span>
                            </button>
                          )}

                          {item.status === "Dalam Tindakan" && (
                            <button
                              type="button"
                              disabled={isRowUpdating}
                              onClick={() =>
                                handleQuickAdvance(item, "Selesai")
                              }
                              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 whitespace-nowrap"
                            >
                              {isRowUpdating ? (
                                <Loader2
                                  className="h-3.5 w-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Check
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                              <span>Selesai</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            aria-label={`Edit aduan #${item.id}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingRecord(item)}
                            aria-label={`Padam aduan #${item.id}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-xs text-slate-500 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Facility Damage Helpdesk · Sistem Aduan Kerosakan Fasiliti
          </p>
          <p>Rekod disusun daripada aduan terkini ke terdahulu.</p>
        </div>
      </footer>

      <AduanFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialData={editingRecord}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        onError={(msg) => pushToast("error", "Operasi tidak berjaya", msg)}
      />

      <DeleteConfirmModal
        record={deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
