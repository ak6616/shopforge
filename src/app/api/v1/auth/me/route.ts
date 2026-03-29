import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, AuthError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = authenticateRequest(req);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { addresses: true },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses,
      createdAt: user.createdAt,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Me error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
