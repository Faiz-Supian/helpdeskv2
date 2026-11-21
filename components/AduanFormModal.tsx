"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import {
  KATEGORI_OPTIONS,
  KEUTAMAAN_OPTIONS,
  STATUS_OPTIONS,
  type AduanRecord,
  type KategoriKerosakan,
  type StatusAduan,
  type TahapKeutamaan,
} from "@/lib/aduan";

interface AduanFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: AduanRecord | null;
  onClose: () => void;
  onSuccess: (record: AduanRecord, mode: "create" | "edit") => void;
  onError: (message: string) => void;
}

interface AduanFormContentProps {
  mode: "create" | "edit";
  initialData?: AduanRecord | null;
  onClose: () => void;
  onSuccess: (record: AduanRecord, mode: "create" | "edit") => void;
  onError: (message: string) => void;
}

function AduanFormContent({
  mode,
  initialData,
  onClose,
  onSuccess,
  onError,
}: AduanFormContentProps) {
  const [pengadu, setPengadu] = useState(() =>
    mode === "edit" && initialData ? initialData.pengadu : ""
  );
  const [lokasi, setLokasi] = useState(() =>
    mode === "edit" && initialData ? initialData.lokasi : ""
  );
  const [kategori, setKategori] = useState<KategoriKerosakan>(() =>
    mode === "edit" &&
    initialData &&
    KATEGORI_OPTIONS.includes(
      initialData.kategori_kerosakan as KategoriKerosakan
    )
      ? (initialData.kategori_kerosakan as KategoriKerosakan)
      : KATEGORI_OPTIONS[0]
  );
  const [keutamaan, setKeutamaan] = useState<TahapKeutamaan>(() =>
    mode === "edit" &&
    initialData &&
    KEUTAMAAN_OPTIONS.includes(initialData.tahap_keutamaan as TahapKeutamaan)
      ? (initialData.tahap_keutamaan as TahapKeutamaan)
      : "Sederhana"
  );
  const [status, setStatus] = useState<StatusAduan>(() =>
    mode === "edit" &&
    initialData &&
    STATUS_OPTIONS.includes(initialData.status as StatusAduan)
      ? (initialData.status as StatusAduan)
      : "Baru"
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const nextErrors: Record<string, string> = {};
    if (!pengadu.trim()) {
      nextErrors.pengadu = "Sila masukkan nama pengadu.";
    }
    if (!lokasi.trim()) {
      nextErrors.lokasi = "Sila masukkan lokasi atau nama bilik.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint =
        mode === "edit" && initialData
          ? `/api/aduan/${initialData.id}`
          : "/api/aduan";
      const method = mode === "edit" ? "PATCH" : "POST";

      const payload =
        mode === "edit"
          ? {
              pengadu: pengadu.trim(),
              lokasi: lokasi.trim(),
              kategori_kerosakan: kategori,
              tahap_keutamaan: keutamaan,
              status,
            }
          : {
              pengadu: pengadu.trim(),
              lokasi: lokasi.trim(),
              kategori_kerosakan: kategori,
              tahap_keutamaan: keutamaan,
              status: "Baru",
            };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (json.fieldErrors && typeof json.fieldErrors === "object") {
          setFieldErrors(json.fieldErrors);
        }
        const message =
          typeof json.error === "string"
            ? json.error
            : "Gagal menyimpan rekod aduan.";
        setFormError(message);
        onError(message);
        return;
      }

      if (json.data) {
        onSuccess(json.data as AduanRecord, mode);
        onClose();
      }
    } catch {
      const message = "Ralat rangkaian. Sila cuba sebentar lagi.";
      setFormError(message);
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aduan-modal-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={() => !isSubmitting && onClose()}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="aduan-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              {mode === "edit"
                ? `Kemas Kini Aduan #${String(initialData?.id ?? "").padStart(3, "0")}`
                : "Lapor Kerosakan Fasiliti"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {mode === "edit"
                ? "Ubah butiran lokasi, kategori, keutamaan, atau status tindakan."
                : "Isi maklumat lokasi dan jenis kerosakan untuk tindakan penyelenggaraan."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup borang"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="field-pengadu"
              className="block text-sm font-medium text-slate-700"
            >
              Nama Pengadu
            </label>
            <input
              id="field-pengadu"
              type="text"
              value={pengadu}
              onChange={(e) => setPengadu(e.target.value)}
              placeholder="cth. Ahmad Faris bin Roslan"
              maxLength={120}
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-none disabled:bg-slate-50"
            />
            {fieldErrors.pengadu && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.pengadu}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="field-lokasi"
              className="block text-sm font-medium text-slate-700"
            >
              Lokasi / Nama Bilik
            </label>
            <input
              id="field-lokasi"
              type="text"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="cth. Blok A - Bilik Kuliah 3"
              maxLength={160}
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-none disabled:bg-slate-50"
            />
            {fieldErrors.lokasi && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.lokasi}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="field-kategori"
              className="block text-sm font-medium text-slate-700"
            >
              Kategori Kerosakan
            </label>
            <select
              id="field-kategori"
              value={kategori}
              onChange={(e) =>
                setKategori(e.target.value as KategoriKerosakan)
              }
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-none disabled:bg-slate-50"
            >
              {KATEGORI_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldErrors.kategori_kerosakan && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.kategori_kerosakan}
              </p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700">
              Tahap Keutamaan
            </span>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {KEUTAMAAN_OPTIONS.map((option) => {
                const isSelected = keutamaan === option;
                const activeStyles =
                  option === "Kritikal"
                    ? "border-red-600 bg-red-50 text-red-700"
                    : option === "Sederhana"
                      ? "border-amber-600 bg-amber-50 text-amber-800"
                      : "border-emerald-600 bg-emerald-50 text-emerald-700";

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setKeutamaan(option)}
                    className={`min-h-[42px] rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      isSelected
                        ? activeStyles
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {fieldErrors.tahap_keutamaan && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.tahap_keutamaan}
              </p>
            )}
          </div>

          {mode === "edit" && (
            <div>
              <label
                htmlFor="field-status"
                className="block text-sm font-medium text-slate-700"
              >
                Status Semasa
              </label>
              <select
                id="field-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAduan)}
                disabled={isSubmitting}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-none disabled:bg-slate-50"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <span>
                {mode === "edit" ? "Simpan Perubahan" : "Hantar Aduan"}
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AduanFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSuccess,
  onError,
}: AduanFormModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <AduanFormContent
          key={`${mode}-${initialData?.id ?? "new"}`}
          mode={mode}
          initialData={initialData}
          onClose={onClose}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
    </AnimatePresence>
  );
}
