import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("Czyszczenie istniejących danych...");
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.salesReport.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ─────────────────────────────────────
  console.log("Tworzenie użytkowników...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@shopforge.pl",
      firstName: "Marcin",
      lastName: "Kowalczyk",
      role: "ADMIN",
      marketingConsent: true,
      gdprConsentAt: new Date(),
    },
  });

  const customers = await Promise.all(
    [
      { email: "jan.nowak@gmail.com", firstName: "Jan", lastName: "Nowak" },
      { email: "anna.wisniewski@wp.pl", firstName: "Anna", lastName: "Wiśniewska" },
      { email: "piotr.zielinski@onet.pl", firstName: "Piotr", lastName: "Zieliński" },
      { email: "katarzyna.kaminska@gmail.com", firstName: "Katarzyna", lastName: "Kamińska" },
      { email: "tomasz.lewandowski@interia.pl", firstName: "Tomasz", lastName: "Lewandowski" },
      { email: "monika.szymanska@wp.pl", firstName: "Monika", lastName: "Szymańska" },
      { email: "marek.wojciechowski@gmail.com", firstName: "Marek", lastName: "Wojciechowski" },
      { email: "ewa.dabrowska@onet.pl", firstName: "Ewa", lastName: "Dąbrowska" },
    ].map((c) =>
      prisma.user.create({
        data: {
          ...c,
          role: "CUSTOMER",
          marketingConsent: Math.random() > 0.3,
          gdprConsentAt: new Date(),
        },
      })
    )
  );

  // Addresses for customers
  const addresses = await Promise.all(
    [
      { userId: customers[0].id, line1: "ul. Marszałkowska 42/15", city: "Warszawa", postalCode: "00-042", country: "PL", isDefault: true },
      { userId: customers[1].id, line1: "ul. Floriańska 18/3", city: "Kraków", postalCode: "31-021", country: "PL", isDefault: true },
      { userId: customers[2].id, line1: "ul. Piotrkowska 120", city: "Łódź", postalCode: "90-006", country: "PL", isDefault: true },
      { userId: customers[3].id, line1: "ul. Świdnicka 33/8", city: "Wrocław", postalCode: "50-066", country: "PL", isDefault: true },
      { userId: customers[4].id, line1: "ul. Długa 14", city: "Gdańsk", postalCode: "80-827", country: "PL", isDefault: true },
      { userId: customers[5].id, line1: "ul. Paderewskiego 7/2", city: "Poznań", postalCode: "61-770", country: "PL", isDefault: true },
      { userId: customers[6].id, line1: "ul. Sienkiewicza 55", city: "Katowice", postalCode: "40-037", country: "PL", isDefault: true },
      { userId: customers[7].id, line1: "ul. Lipowa 22/10", city: "Lublin", postalCode: "20-020", country: "PL", isDefault: true },
    ].map((a) => prisma.address.create({ data: a }))
  );

  // ─── Categories ────────────────────────────────
  console.log("Tworzenie kategorii...");
  const categories = await Promise.all(
    [
      { name: "Elektronika", slug: "elektronika", description: "Smartfony, laptopy, akcesoria elektroniczne" },
      { name: "Odzież", slug: "odziez", description: "Modna odzież damska i męska" },
      { name: "Dom i ogród", slug: "dom-ogrod", description: "Wyposażenie domu, dekoracje, narzędzia ogrodowe" },
      { name: "Sport", slug: "sport", description: "Sprzęt sportowy i odzież aktywna" },
    ].map((c) => prisma.category.create({ data: c }))
  );

  // ─── Products (20 total, 5 per category) ───────
  console.log("Tworzenie produktów...");

  const productDefs = [
    // Elektronika
    { name: "Smartfon Galaxy Pro 15", slug: "smartfon-galaxy-pro-15", description: "Najnowszy smartfon z ekranem AMOLED 6.7\" i aparatem 108 MP", catIdx: 0, price: 349900, sku: "ELEC-001", stock: 25 },
    { name: "Laptop UltraBook X1", slug: "laptop-ultrabook-x1", description: "Lekki laptop biznesowy, 14\" IPS, Intel i7, 16GB RAM", catIdx: 0, price: 549900, sku: "ELEC-002", stock: 12 },
    { name: "Słuchawki bezprzewodowe AirMax", slug: "sluchawki-airmax", description: "Słuchawki z ANC, 30h baterii, Hi-Res Audio", catIdx: 0, price: 79900, sku: "ELEC-003", stock: 50 },
    { name: "Tablet Creative Pad 12", slug: "tablet-creative-pad-12", description: "Tablet z rysikiem, idealny do rysowania i notatek", catIdx: 0, price: 249900, sku: "ELEC-004", stock: 18 },
    { name: "Smartwatch FitTrack 5", slug: "smartwatch-fittrack-5", description: "Zegarek sportowy z GPS, pulsometrem i 14 dni baterii", catIdx: 0, price: 119900, sku: "ELEC-005", stock: 35 },
    // Odzież
    { name: "Kurtka zimowa Arctic", slug: "kurtka-zimowa-arctic", description: "Ciepła kurtka puchowa, wodoodporna, -30°C", catIdx: 1, price: 49900, sku: "ODZE-001", stock: 20 },
    { name: "Sukienka koktajlowa Elegance", slug: "sukienka-elegance", description: "Elegancka sukienka wieczorowa, rozmiary S-XL", catIdx: 1, price: 29900, sku: "ODZE-002", stock: 15 },
    { name: "Jeansy Slim Fit Premium", slug: "jeansy-slim-fit", description: "Klasyczne jeansy męskie, 98% bawełna, ciemny granat", catIdx: 1, price: 19900, sku: "ODZE-003", stock: 40 },
    { name: "Bluza dresowa Comfort", slug: "bluza-comfort", description: "Miękka bluza z kapturem, oversize, unisex", catIdx: 1, price: 14900, sku: "ODZE-004", stock: 60 },
    { name: "Koszula lniana Summer", slug: "koszula-lniana-summer", description: "Przewiewna koszula z lnu, idealna na lato", catIdx: 1, price: 17900, sku: "ODZE-005", stock: 30 },
    // Dom i ogród
    { name: "Lampa wisząca Scandinavian", slug: "lampa-scandinavian", description: "Minimalistyczna lampa w stylu skandynawskim, drewno/metal", catIdx: 2, price: 34900, sku: "DOM-001", stock: 22 },
    { name: "Zestaw pościeli bawełnianej 200x220", slug: "posciel-bawelniana", description: "100% bawełna satynowa, 4 elementy, szary/biały", catIdx: 2, price: 24900, sku: "DOM-002", stock: 18 },
    { name: "Robot kuchenny MultiChef", slug: "robot-multichef", description: "Wielofunkcyjny robot kuchenny, 1200W, 12 programów", catIdx: 2, price: 89900, sku: "DOM-003", stock: 10 },
    { name: "Doniczka ceramiczna Botanic", slug: "doniczka-botanic", description: "Ręcznie malowana doniczka, 3 rozmiary, terracotta", catIdx: 2, price: 7900, sku: "DOM-004", stock: 45 },
    { name: "Grill ogrodowy MasterBBQ", slug: "grill-masterbbq", description: "Grill węglowy z pokrywą, termometr, stal nierdzewna", catIdx: 2, price: 129900, sku: "DOM-005", stock: 8 },
    // Sport
    { name: "Rower górski TrailBlaze 29\"", slug: "rower-trailblaze", description: "Rower MTB, rama aluminiowa, amortyzator Rockshox", catIdx: 3, price: 389900, sku: "SPORT-001", stock: 6 },
    { name: "Mata do jogi Premium", slug: "mata-jogi-premium", description: "Antypoślizgowa mata TPE, 6mm, z paskiem do noszenia", catIdx: 3, price: 12900, sku: "SPORT-002", stock: 55 },
    { name: "Hantle regulowane 2-24kg", slug: "hantle-regulowane", description: "Kompaktowe hantle z regulacją wagi, para", catIdx: 3, price: 149900, sku: "SPORT-003", stock: 14 },
    { name: "Buty biegowe SpeedRunner", slug: "buty-speedrunner", description: "Lekkie buty do biegania, pianka React, rozmiary 38-47", catIdx: 3, price: 59900, sku: "SPORT-004", stock: 28 },
    { name: "Namiot turystyczny Explorer 3", slug: "namiot-explorer-3", description: "Namiot 3-osobowy, 3000mm słupa wody, 2.8kg", catIdx: 3, price: 79900, sku: "SPORT-005", stock: 16 },
  ];

  const products: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  const variants: Awaited<ReturnType<typeof prisma.productVariant.create>>[] = [];

  for (const p of productDefs) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.description.slice(0, 80),
        status: "ACTIVE",
        tags: [],
      },
    });
    products.push(product);

    await prisma.productCategory.create({
      data: { productId: product.id, categoryId: categories[p.catIdx].id },
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `https://placehold.co/800x600/e2e8f0/475569?text=${encodeURIComponent(p.name.split(" ").slice(0, 2).join("+"))}`,
        altText: p.name,
        sortOrder: 0,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: p.sku,
        name: "Domyślny",
        priceAmount: p.price,
        currency: "PLN",
        stockQuantity: p.stock,
        options: {},
      },
    });
    variants.push(variant);
  }

  // ─── Discount codes ────────────────────────────
  console.log("Tworzenie kodów rabatowych...");
  await Promise.all([
    prisma.discountCode.create({
      data: {
        code: "LATO20",
        description: "20% rabatu na zakupy letnie",
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 10000,
        maxUses: 100,
        usedCount: 34,
        active: true,
        expiresAt: new Date("2026-08-31"),
      },
    }),
    prisma.discountCode.create({
      data: {
        code: "WELCOME10",
        description: "10% zniżki dla nowych klientów",
        discountType: "percentage",
        discountValue: 10,
        maxUses: 500,
        usedCount: 187,
        active: true,
        expiresAt: new Date("2026-12-31"),
      },
    }),
    prisma.discountCode.create({
      data: {
        code: "VIP15",
        description: "15% rabatu dla klientów VIP",
        discountType: "percentage",
        discountValue: 15,
        minOrderAmount: 20000,
        maxUses: 50,
        usedCount: 12,
        active: true,
        expiresAt: new Date("2026-06-30"),
      },
    }),
  ]);

  // ─── Orders (15 total) ─────────────────────────
  console.log("Tworzenie zamówień...");

  const orderStatuses: Array<{
    status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    events: Array<{ type: "CREATED" | "PAYMENT_SUCCEEDED" | "SHIPPED" | "DELIVERED" | "CANCELLED"; desc: string }>;
  }> = [
    { status: "PENDING", events: [{ type: "CREATED", desc: "Zamówienie złożone" }] },
    { status: "PENDING", events: [{ type: "CREATED", desc: "Zamówienie złożone" }] },
    { status: "PAID", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }] },
    { status: "PAID", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }] },
    { status: "SHIPPED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "SHIPPED", desc: "Przesyłka nadana — InPost" }] },
    { status: "SHIPPED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "SHIPPED", desc: "Przesyłka nadana — DPD" }] },
    { status: "SHIPPED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "SHIPPED", desc: "Przesyłka nadana — Poczta Polska" }] },
    { status: "DELIVERED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "SHIPPED", desc: "Przesyłka nadana" }, { type: "DELIVERED", desc: "Przesyłka dostarczona" }] },
    { status: "DELIVERED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "SHIPPED", desc: "Przesyłka nadana" }, { type: "DELIVERED", desc: "Przesyłka dostarczona" }] },
    { status: "DELIVERED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "SHIPPED", desc: "Przesyłka nadana" }, { type: "DELIVERED", desc: "Przesyłka dostarczona" }] },
    { status: "DELIVERED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "SHIPPED", desc: "Przesyłka nadana" }, { type: "DELIVERED", desc: "Przesyłka dostarczona" }] },
    { status: "DELIVERED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "SHIPPED", desc: "Przesyłka nadana" }, { type: "DELIVERED", desc: "Przesyłka dostarczona" }] },
    { status: "CANCELLED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "CANCELLED", desc: "Anulowane przez klienta" }] },
    { status: "CANCELLED", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }, { type: "CANCELLED", desc: "Anulowane — brak towaru" }] },
    { status: "PAID", events: [{ type: "CREATED", desc: "Zamówienie złożone" }, { type: "PAYMENT_SUCCEEDED", desc: "Płatność zaksięgowana" }] },
  ];

  for (let i = 0; i < 15; i++) {
    const daysAgo = 90 - i * 6;
    const orderDate = new Date(Date.now() - daysAgo * 86400000);
    const customerIdx = i % customers.length;
    const orderDef = orderStatuses[i];

    // Pick 1-3 random product variants for each order
    const itemCount = 1 + (i % 3);
    const orderItems = [];
    let subtotal = 0;
    for (let j = 0; j < itemCount; j++) {
      const variantIdx = (i * 3 + j) % variants.length;
      const qty = 1 + (j % 2);
      const unitPrice = variants[variantIdx].priceAmount;
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;
      orderItems.push({
        variantId: variants[variantIdx].id,
        productName: products[variantIdx].name,
        variantName: "Domyślny",
        sku: variants[variantIdx].sku,
        quantity: qty,
        unitPrice,
        totalPrice,
      });
    }

    const shippingAmount = subtotal > 20000 ? 0 : 1499;
    const taxAmount = Math.round(subtotal * 0.23);
    const totalAmount = subtotal + shippingAmount;

    const order = await prisma.order.create({
      data: {
        orderNumber: `SF-2026-${String(i + 1).padStart(4, "0")}`,
        userId: customers[customerIdx].id,
        addressId: addresses[customerIdx].id,
        status: orderDef.status,
        currency: "PLN",
        subtotalAmount: subtotal,
        shippingAmount,
        taxAmount,
        totalAmount,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: { create: orderItems },
        events: {
          create: orderDef.events.map((e, idx) => ({
            type: e.type,
            description: e.desc,
            source: "system",
            createdAt: new Date(orderDate.getTime() + idx * 3600000),
          })),
        },
      },
    });

    // Create payment for paid/shipped/delivered orders
    if (["PAID", "SHIPPED", "DELIVERED"].includes(orderDef.status)) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          stripePaymentIntentId: `pi_demo_${order.orderNumber.replace(/-/g, "")}`,
          amount: totalAmount,
          currency: "PLN",
          status: "SUCCEEDED",
          createdAt: new Date(orderDate.getTime() + 1800000),
        },
      });
    }
  }

  // ─── Sales Reports (monthly) ───────────────────
  console.log("Tworzenie raportów sprzedaży...");
  const reportData = [
    {
      month: new Date("2026-01-01"),
      totalRevenue: 4523400,
      orderCount: 42,
      averageOrderVal: 107700,
      topProducts: [
        { productName: "Smartfon Galaxy Pro 15", unitsSold: 8, revenue: 2799200 },
        { productName: "Laptop UltraBook X1", unitsSold: 3, revenue: 1649700 },
        { productName: "Rower górski TrailBlaze 29\"", unitsSold: 2, revenue: 779800 },
      ],
      notes: "Silna sprzedaż poświąteczna elektroniki",
    },
    {
      month: new Date("2026-02-01"),
      totalRevenue: 3875200,
      orderCount: 38,
      averageOrderVal: 101979,
      topProducts: [
        { productName: "Kurtka zimowa Arctic", unitsSold: 12, revenue: 598800 },
        { productName: "Robot kuchenny MultiChef", unitsSold: 5, revenue: 449500 },
        { productName: "Smartwatch FitTrack 5", unitsSold: 7, revenue: 839300 },
      ],
      notes: "Sezon wyprzedaży zimowej — wzrost odzieży",
    },
    {
      month: new Date("2026-03-01"),
      totalRevenue: 5124800,
      orderCount: 51,
      averageOrderVal: 100486,
      topProducts: [
        { productName: "Laptop UltraBook X1", unitsSold: 5, revenue: 2749500 },
        { productName: "Hantle regulowane 2-24kg", unitsSold: 8, revenue: 1199200 },
        { productName: "Buty biegowe SpeedRunner", unitsSold: 10, revenue: 599000 },
      ],
      notes: "Wzrost kategorii sport — sezon wiosenny",
    },
  ];

  await Promise.all(
    reportData.map((r) => prisma.salesReport.create({ data: r }))
  );

  console.log("\n✅ Seed zakończony pomyślnie!");
  console.log("   Produkty: 20 (5 per kategoria)");
  console.log("   Zamówienia: 15");
  console.log("   Kody rabatowe: 3");
  console.log("   Raporty sprzedaży: 3");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
