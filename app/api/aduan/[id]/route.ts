import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateUpdateAduan } from "@/lib/aduan";

export const dynamic = "force-dynamic";

function parseAduanId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const parsed = Number(rawId);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const aduanId = parseAduanId(id);

    if (aduanId === null) {
      return NextResponse.json(
        { error: "ID aduan tidak sah." },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Kandungan JSON tidak sah." },
        { status: 400 }
      );
    }

    const validation = validateUpdateAduan(body);
    if (!validation.data) {
      return NextResponse.json(
        {
          error: validation.error,
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.aduan.update({
      where: { id: aduanId },
      data: validation.data,
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Rekod aduan tidak dijumpai." },
        { status: 404 }
      );
    }

    console.error("PATCH /api/aduan/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal mengemas kini rekod aduan." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const aduanId = parseAduanId(id);

    if (aduanId === null) {
      return NextResponse.json(
        { error: "ID aduan tidak sah." },
        { status: 400 }
      );
    }

    await prisma.aduan.delete({
      where: { id: aduanId },
    });

    return NextResponse.json(
      { success: true, id: aduanId },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Rekod aduan tidak dijumpai." },
        { status: 404 }
      );
    }

    console.error("DELETE /api/aduan/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memadam rekod aduan." },
      { status: 500 }
    );
  }
}
