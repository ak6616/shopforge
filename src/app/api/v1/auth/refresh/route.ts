import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, verifyRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 }
      );
    }

    let decoded: { userId: string };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ accessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
