import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error("Categories list error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
