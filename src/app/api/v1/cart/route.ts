import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCart, setCartCookie } from "@/lib/cart";

export async function GET(req: NextRequest) {
  try {
    const { cart, token, isNew } = await getOrCreateCart(req);

    const subtotal = cart.items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0
    );

    const response = NextResponse.json({
      id: cart.id,
      token: cart.token,
      currency: cart.currency,
      items: cart.items.map((item: {
        id: string;
        variantId: string;
        quantity: number;
        unitPrice: number;
        variant: {
          id: string;
          name: string;
          sku: string;
          imageUrl: string | null;
          stockQuantity: number;
          product: { id: string; name: string; slug: string };
        };
      }) => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        variant: {
          id: item.variant.id,
          name: item.variant.name,
          sku: item.variant.sku,
          imageUrl: item.variant.imageUrl,
          stockQuantity: item.variant.stockQuantity,
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            slug: item.variant.product.slug,
          },
        },
      })),
      subtotal,
      itemCount: cart.items.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0
      ),
    });

    if (isNew) {
      response.headers.set("Set-Cookie", setCartCookie(token));
    }

    return response;
  } catch (err) {
    console.error("Cart get error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cartToken = req.cookies.get("cart_token")?.value;
    if (!cartToken) {
      return NextResponse.json({ error: "No cart found" }, { status: 404 });
    }

    const { prisma } = await import("@/lib/prisma");
    await prisma.cartItem.deleteMany({
      where: { cart: { token: cartToken } },
    });

    return NextResponse.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("Cart clear error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
