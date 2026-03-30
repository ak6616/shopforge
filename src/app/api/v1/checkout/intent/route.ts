import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/orders";
import { authenticateRequest, AuthError } from "@/lib/auth";

const AddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(2).max(2),
});

const CartItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().min(1),
});

const IntentSchema = z.object({
  cartItems: z.array(CartItemSchema).min(1),
  shippingAddress: AddressSchema,
  shippingMethod: z.string().default("standard"),
});

class InsufficientStockError extends Error {
  sku: string;
  constructor(sku: string) {
    super(`Insufficient stock for SKU ${sku}`);
    this.sku = sku;
  }
}

const SHIPPING_AMOUNTS: Record<string, number> = {
  standard: 0,
  express: 999,
  overnight: 2499,
};

export async function POST(req: NextRequest) {
  try {
    const authPayload = authenticateRequest(req);
    const body = IntentSchema.parse(await req.json());

    // Resolve variants (read-only check that all IDs are valid)
    const variantIds = body.cartItems.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json(
        { error: "One or more cart items reference invalid variants" },
        { status: 400 }
      );
    }

    const shippingAmount = SHIPPING_AMOUNTS[body.shippingMethod] ?? 0;
    const taxAmount = 0;

    // Fetch the authenticated user
    const user = await prisma.user.findUnique({ where: { id: authPayload.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;

    // Atomic transaction: lock variant rows, validate stock, decrement, and create order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await prisma.$transaction(async (tx: any) => {
      // Lock variant rows with SELECT ... FOR UPDATE to prevent concurrent oversell
      const lockedVariants = await tx.$queryRaw`
        SELECT id, sku, name, "priceAmount", "stockQuantity"
        FROM "ProductVariant"
        WHERE id IN (${Prisma.join(variantIds)})
        FOR UPDATE
      `;

      const variantMap = new Map(
        (lockedVariants as Array<{ id: string; sku: string; name: string; priceAmount: number; stockQuantity: number }>)
          .map((v) => [v.id, v])
      );

      // Validate stock under lock
      for (const item of body.cartItems) {
        const variant = variantMap.get(item.variantId)!;
        if (variant.stockQuantity < item.quantity) {
          throw new InsufficientStockError(variant.sku);
        }
      }

      // Decrement stock atomically
      for (const item of body.cartItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      const subtotal = body.cartItems.reduce((sum, item) => {
        const variant = variantMap.get(item.variantId)!;
        return sum + variant.priceAmount * item.quantity;
      }, 0);
      const totalAmount = subtotal + shippingAmount + taxAmount;

      // Create address record
      const address = await tx.address.create({
        data: {
          userId: user.id,
          line1: body.shippingAddress.address1,
          line2: body.shippingAddress.address2 ?? null,
          city: body.shippingAddress.city,
          state: body.shippingAddress.state,
          postalCode: body.shippingAddress.postalCode,
          country: body.shippingAddress.country,
        },
      });

      const newOrder = await tx.order.create({
        data: {
          orderNumber: await generateOrderNumber(),
          userId: user.id,
          addressId: address.id,
          status: "PENDING",
          currency: "PLN",
          subtotalAmount: subtotal,
          shippingAmount,
          taxAmount,
          totalAmount,
          ipAddress,
          items: {
            create: body.cartItems.map((item) => {
              const variant = variantMap.get(item.variantId)!;
              return {
                variantId: item.variantId,
                productName: variant.name,
                variantName: variant.name,
                sku: variant.sku,
                quantity: item.quantity,
                unitPrice: variant.priceAmount,
                totalPrice: variant.priceAmount * item.quantity,
              };
            }),
          },
          events: {
            create: {
              type: "CREATED",
              description: "Order created from checkout",
              source: "system",
            },
          },
        },
      });

      return newOrder;
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalAmount,
      currency: "pln",
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        status: "PAYMENT_PROCESSING",
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_INITIATED",
        description: `PaymentIntent ${paymentIntent.id} created`,
        source: "system",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof InsufficientStockError) {
      return NextResponse.json(
        { error: err.message },
        { status: 409 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Checkout intent error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
