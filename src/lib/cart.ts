import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { v4 as uuidv4 } from "uuid";

export async function getOrCreateCart(req: NextRequest) {
  const cartToken = req.cookies.get("cart_token")?.value;

  if (cartToken) {
    const cart = await prisma.cart.findUnique({
      where: { token: cartToken },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
    if (cart) return { cart, token: cartToken, isNew: false };
  }

  const newToken = uuidv4();
  const cart = await prisma.cart.create({
    data: { token: newToken },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  return { cart, token: newToken, isNew: true };
}

export function setCartCookie(token: string): string {
  return `cart_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}
