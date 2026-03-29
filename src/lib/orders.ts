import { prisma } from "./prisma";

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: `SF-${year}-` } },
    orderBy: { createdAt: "desc" },
  });

  let seq = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-");
    seq = parseInt(parts[2], 10) + 1;
  }

  return `SF-${year}-${String(seq).padStart(5, "0")}`;
}
