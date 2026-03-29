import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, setCartCookie } from "@/lib/cart";

const AddItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().min(1).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = AddItemSchema.parse(await req.json());
    const { cart, token, isNew } = await getOrCreateCart(req);

    const variant = await prisma.productVariant.findUnique({
      where: { id: body.variantId },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    if (variant.stockQuantity < body.quantity) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 409 }
      );
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: body.variantId } },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + body.quantity;
      if (variant.stockQuantity < newQty) {
        return NextResponse.json(
          { error: "Insufficient stock for requested quantity" },
          { status: 409 }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: body.variantId,
          quantity: body.quantity,
          unitPrice: variant.priceAmount,
        },
      });
    }

    const response = NextResponse.json({ message: "Item added to cart" }, { status: 201 });
    if (isNew) {
      response.headers.set("Set-Cookie", setCartCookie(token));
    }
    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Cart add error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
