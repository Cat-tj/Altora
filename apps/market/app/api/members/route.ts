import { NextResponse } from "next/server";
import { auth } from "../../auth";
import { db } from "../../lib/db";

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as { id?: string; tenantId?: string; role?: string } | undefined;
  if (!user?.id || !user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, phone, email } = body ?? {};
  if (!name?.trim() || !phone?.trim()) return NextResponse.json({ error: "Nama dan No. HP wajib diisi." }, { status: 400 });

  try {
    const member = await db.member.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        points: 0,
        deposit: 0,
      },
    });
    return NextResponse.json({ success: true, id: member.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Gagal menyimpan." }, { status: 500 });
  }
}
