import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin, AuthError } from "@/lib/auth";

const CreateProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  taxCategory: z.string().optional(),
  vendor: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        sku: z.string(),
        name: z.string(),
        priceAmount: z.number().int(),
        currency: z.string().optional(),
        compareAtPrice: z.number().int().optional(),
        stockQuantity: z.number().int().optional(),
        lowStockThreshold: z.number().int().optional(),
        weight: z.number().optional(),
        barcode: z.string().optional(),
        options: z.record(z.string(), z.string()).optional(),
        imageUrl: z.string().optional(),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string(),
        altText: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    requireSuperAdmin(req);
    const body = CreateProductSchema.parse(await req.json());

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        shortDescription: body.shortDescription,
        status: body.status || "DRAFT",
        taxCategory: body.taxCategory,
        vendor: body.vendor,
        tags: body.tags || [],
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        categories: body.categoryIds?.length
          ? { create: body.categoryIds.map((categoryId: string) => ({ categoryId })) }
          : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        variants: body.variants?.length ? { create: body.variants as any } : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: body.images?.length ? { create: body.images as any } : undefined,
      },
      include: {
        variants: true,
        images: true,
        categories: { include: { category: true } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Create product error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
          categories: { include: { category: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Admin products list error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
