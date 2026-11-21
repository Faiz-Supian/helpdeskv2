import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCreateAduan } from "@/lib/aduan";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await prisma.aduan.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return NextResponse.json({ data: records }, { status: 200 });
  } catch (error) {
    console.error("GET /api/aduan error:", error);
    return NextResponse.json(
      {
        error:
          "Gagal mendapatkan senarai aduan daripada pangkalan data. Sila pastikan DATABASE_URL dikonfigurasi dan jadual Prisma telah ditolak.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Kandungan JSON tidak sah." },
        { status: 400 }
      );
    }

    const validation = validateCreateAduan(body);
    if (!validation.data) {
      return NextResponse.json(
        {
          error: validation.error,
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const created = await prisma.aduan.create({
      data: {
        pengadu: validation.data.pengadu,
        lokasi: validation.data.lokasi,
        kategori_kerosakan: validation.data.kategori_kerosakan,
        tahap_keutamaan: validation.data.tahap_keutamaan,
        status: validation.data.status ?? "Baru",
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/aduan error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan aduan baharu ke pangkalan data." },
      { status: 500 }
    );
  }
}
