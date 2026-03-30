import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "test@shopforge.app" },
  });

  if (existing) {
    console.log("ShopForge: test user already exists");
    return;
  }

  const passwordHash = await bcrypt.hash("Test123!", 12);
  await prisma.user.create({
    data: {
      email: "test@shopforge.app",
      firstName: "Test",
      lastName: "User",
      passwordHash,
      role: "CUSTOMER",
    },
  });
  console.log("ShopForge: created test user test@shopforge.app");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
