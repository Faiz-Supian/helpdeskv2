export const KATEGORI_OPTIONS = [
  "Penyaman Udara",
  "Elektrik/Lampu",
  "Wi-Fi/Rangkaian",
  "Paip/Air",
  "Perabot",
  "Lain-lain",
] as const;

export const KEUTAMAAN_OPTIONS = ["Rendah", "Sederhana", "Kritikal"] as const;

export const STATUS_OPTIONS = ["Baru", "Dalam Tindakan", "Selesai"] as const;

export type KategoriKerosakan = (typeof KATEGORI_OPTIONS)[number];
export type TahapKeutamaan = (typeof KEUTAMAAN_OPTIONS)[number];
export type StatusAduan = (typeof STATUS_OPTIONS)[number];

export interface AduanRecord {
  id: number;
  pengadu: string;
  lokasi: string;
  kategori_kerosakan: string;
  tahap_keutamaan: string;
  status: string;
  createdAt: string;
}

export interface CreateAduanInput {
  pengadu: string;
  lokasi: string;
  kategori_kerosakan: KategoriKerosakan;
  tahap_keutamaan: TahapKeutamaan;
  status?: StatusAduan;
}

export interface UpdateAduanInput {
  pengadu?: string;
  lokasi?: string;
  kategori_kerosakan?: KategoriKerosakan;
  tahap_keutamaan?: TahapKeutamaan;
  status?: StatusAduan;
}

const MAX_NAME_LENGTH = 120;
const MAX_LOCATION_LENGTH = 160;

export function validateCreateAduan(body: unknown): {
  data?: CreateAduanInput;
  error?: string;
  fieldErrors?: Record<string, string>;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Format permintaan JSON tidak sah." };
  }

  const raw = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};

  const pengadu = typeof raw.pengadu === "string" ? raw.pengadu.trim() : "";
  const lokasi = typeof raw.lokasi === "string" ? raw.lokasi.trim() : "";
  const kategori_kerosakan =
    typeof raw.kategori_kerosakan === "string" ? raw.kategori_kerosakan.trim() : "";
  const tahap_keutamaan =
    typeof raw.tahap_keutamaan === "string" ? raw.tahap_keutamaan.trim() : "";
  const status =
    typeof raw.status === "string" && raw.status.trim().length > 0
      ? raw.status.trim()
      : "Baru";

  if (!pengadu) {
    fieldErrors.pengadu = "Nama pengadu diperlukan.";
  } else if (pengadu.length > MAX_NAME_LENGTH) {
    fieldErrors.pengadu = `Nama pengadu maksimum ${MAX_NAME_LENGTH} aksara.`;
  }

  if (!lokasi) {
    fieldErrors.lokasi = "Lokasi atau nama bilik diperlukan.";
  } else if (lokasi.length > MAX_LOCATION_LENGTH) {
    fieldErrors.lokasi = `Lokasi maksimum ${MAX_LOCATION_LENGTH} aksara.`;
  }

  if (!KATEGORI_OPTIONS.includes(kategori_kerosakan as KategoriKerosakan)) {
    fieldErrors.kategori_kerosakan = "Sila pilih kategori kerosakan yang sah.";
  }

  if (!KEUTAMAAN_OPTIONS.includes(tahap_keutamaan as TahapKeutamaan)) {
    fieldErrors.tahap_keutamaan = "Sila pilih tahap keutamaan yang sah.";
  }

  if (!STATUS_OPTIONS.includes(status as StatusAduan)) {
    fieldErrors.status = "Status aduan tidak sah.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Sila lengkapkan semua medan yang diperlukan dengan betul.",
      fieldErrors,
    };
  }

  return {
    data: {
      pengadu,
      lokasi,
      kategori_kerosakan: kategori_kerosakan as KategoriKerosakan,
      tahap_keutamaan: tahap_keutamaan as TahapKeutamaan,
      status: status as StatusAduan,
    },
  };
}

export function validateUpdateAduan(body: unknown): {
  data?: UpdateAduanInput;
  error?: string;
  fieldErrors?: Record<string, string>;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Format permintaan JSON tidak sah." };
  }

  const raw = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const data: UpdateAduanInput = {};

  if ("pengadu" in raw) {
    const pengadu = typeof raw.pengadu === "string" ? raw.pengadu.trim() : "";
    if (!pengadu) {
      fieldErrors.pengadu = "Nama pengadu tidak boleh kosong.";
    } else if (pengadu.length > MAX_NAME_LENGTH) {
      fieldErrors.pengadu = `Nama pengadu maksimum ${MAX_NAME_LENGTH} aksara.`;
    } else {
      data.pengadu = pengadu;
    }
  }

  if ("lokasi" in raw) {
    const lokasi = typeof raw.lokasi === "string" ? raw.lokasi.trim() : "";
    if (!lokasi) {
      fieldErrors.lokasi = "Lokasi tidak boleh kosong.";
    } else if (lokasi.length > MAX_LOCATION_LENGTH) {
      fieldErrors.lokasi = `Lokasi maksimum ${MAX_LOCATION_LENGTH} aksara.`;
    } else {
      data.lokasi = lokasi;
    }
  }

  if ("kategori_kerosakan" in raw) {
    const kategori =
      typeof raw.kategori_kerosakan === "string" ? raw.kategori_kerosakan.trim() : "";
    if (!KATEGORI_OPTIONS.includes(kategori as KategoriKerosakan)) {
      fieldErrors.kategori_kerosakan = "Kategori kerosakan tidak sah.";
    } else {
      data.kategori_kerosakan = kategori as KategoriKerosakan;
    }
  }

  if ("tahap_keutamaan" in raw) {
    const keutamaan =
      typeof raw.tahap_keutamaan === "string" ? raw.tahap_keutamaan.trim() : "";
    if (!KEUTAMAAN_OPTIONS.includes(keutamaan as TahapKeutamaan)) {
      fieldErrors.tahap_keutamaan = "Tahap keutamaan tidak sah.";
    } else {
      data.tahap_keutamaan = keutamaan as TahapKeutamaan;
    }
  }

  if ("status" in raw) {
    const status = typeof raw.status === "string" ? raw.status.trim() : "";
    if (!STATUS_OPTIONS.includes(status as StatusAduan)) {
      fieldErrors.status = "Status aduan tidak sah.";
    } else {
      data.status = status as StatusAduan;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Terdapat nilai yang tidak sah dalam kemas kini aduan.",
      fieldErrors,
    };
  }

  if (Object.keys(data).length === 0) {
    return { error: "Tiada medan untuk dikemas kini." };
  }

  return { data };
}
