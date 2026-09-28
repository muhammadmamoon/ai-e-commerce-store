import { PrismaClient, Role, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log("🚀 Starting comprehensive database seed...");

  // ---------------------------------------------------------------------------
  // 1. CLEAN EXISTING DATA (In safe foreign-key order)
  // ---------------------------------------------------------------------------
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log("✔ Cleared old records.");

  // ---------------------------------------------------------------------------
  // 2. CREATE ADMIN & DEMO CUSTOMERS
  // ---------------------------------------------------------------------------
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const customerPassword = await bcrypt.hash("Customer@123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Super Administrator",
      email: "admin@store.com",
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      phone: "+1-555-0100",
      wishlist: { create: {} },
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "alex@example.com",
      password: customerPassword,
      role: Role.CUSTOMER,
      phone: "+1-555-0191",
      wishlist: { create: {} },
      addresses: {
        create: {
          street: "742 Evergreen Terrace",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "United States",
          isDefault: true,
        },
      },
    },
    include: { wishlist: true },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      password: customerPassword,
      role: Role.CUSTOMER,
      phone: "+1-555-0192",
      wishlist: { create: {} },
    },
    include: { wishlist: true },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: "David Kim",
      email: "david@example.com",
      password: customerPassword,
      role: Role.CUSTOMER,
      phone: "+1-555-0193",
      wishlist: { create: {} },
    },
    include: { wishlist: true },
  });

  console.log(
    "✔ Created Admin (admin@store.com / Admin@123456) and 3 Demo Customers.",
  );

  // ---------------------------------------------------------------------------
  // 3. CREATE CATEGORIES & SUBCATEGORIES
  // ---------------------------------------------------------------------------
  const electronics = await prisma.category.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      description:
        "Flagship smartphones, high-performance laptops, and studio audio gear.",
      isActive: true,
    },
  });

  const mobilePhones = await prisma.category.create({
    data: {
      name: "Mobile Phones",
      slug: "mobile-phones",
      description: "Next-generation 5G smartphones and foldables.",
      parentId: electronics.id,
      isActive: true,
    },
  });

  const laptops = await prisma.category.create({
    data: {
      name: "Laptops",
      slug: "laptops",
      description: "Ultrabooks, creator workstations, and gaming laptops.",
      parentId: electronics.id,
      isActive: true,
    },
  });

  const audioGear = await prisma.category.create({
    data: {
      name: "Headphones & Audio",
      slug: "headphones-audio",
      description: "Active noise-cancelling headphones and wireless earbuds.",
      parentId: electronics.id,
      isActive: true,
    },
  });

  const wearables = await prisma.category.create({
    data: {
      name: "Smart Watches",
      slug: "smart-watches",
      description: "Fitness trackers and luxury smart timepieces.",
      parentId: electronics.id,
      isActive: true,
    },
  });

  const fashion = await prisma.category.create({
    data: {
      name: "Apparel & Gear",
      slug: "apparel-gear",
      description: "Everyday techwear, backpacks, and minimalist accessories.",
      isActive: true,
    },
  });

  console.log("✔ Created hierarchical Category tree.");

  // ---------------------------------------------------------------------------
  // 4. CREATE PRODUCTS, VARIANTS & IMAGES
  // ---------------------------------------------------------------------------

  // Product 1: High Velocity + Low Stock (Triggers Hot Badge + Critical Restock Alert)
  const iphone17 = await prisma.product.create({
    data: {
      name: "iPhone 17 Pro Titanium",
      slug: "iphone-17-pro-titanium",
      categoryId: mobilePhones.id,
      shortDesc:
        "A19 Pro chip, aerospace-grade titanium chassis, and 48MP ProRAW camera system.",
      description:
        "Experience flagship mobile computing with the iPhone 17 Pro. Crafted from Grade 5 titanium with a micro-blasted finish, it features the blazing-fast A19 Pro silicon, all-day battery life, and a next-generation tetraprism telephoto lens.",
      basePrice: 1099.0,
      isFeatured: true,
      isHot: true,
      hotScore: 94,
      seoTitle: "Buy iPhone 17 Pro Titanium | Official Warranty",
      seoDesc:
        "Order the iPhone 17 Pro in Black or Natural Titanium with fast express delivery.",
      seoKeywords: "iphone 17 pro, apple smartphone, titanium phone, 5g",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1000&q=80",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000&q=80",
            isPrimary: false,
          },
        ],
      },
      variants: {
        create: [
          {
            name: "256GB — Black Titanium",
            sku: "IP17P-256-BLK",
            barcode: "8800112233441",
            price: 1099.0,
            costPrice: 820.0,
            stock: 4, // Intentionally low to trigger AI Low-Stock Alert
            lowStockAlert: 10,
          },
          {
            name: "512GB — Natural Titanium",
            sku: "IP17P-512-NAT",
            barcode: "8800112233442",
            price: 1299.0,
            costPrice: 950.0,
            stock: 3, // Intentionally low
            lowStockAlert: 8,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 2: High Revenue Laptop
  const macbookPro = await prisma.product.create({
    data: {
      name: "ProBook Studio X16 Laptop",
      slug: "probook-studio-x16-laptop",
      categoryId: laptops.id,
      shortDesc:
        "16-inch Mini-LED 120Hz display, 32GB unified memory, and 1TB NVMe SSD.",
      description:
        "Built for software engineers, 3D artists, and AI researchers. The ProBook Studio X16 pairs a color-calibrated Liquid Retina XDR display with whisper-quiet thermal architecture and 22-hour battery stamina.",
      basePrice: 1899.0,
      isFeatured: true,
      isHot: true,
      hotScore: 88,
      seoTitle: "ProBook Studio X16 Laptop | 32GB RAM 1TB SSD",
      seoDesc: "Workstation-class laptop for developers and creators.",
      seoKeywords: "laptop, creator laptop, 32gb ram, workstation",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&q=80",
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: "32GB RAM / 1TB SSD — Space Gray",
            sku: "PBX16-32-1TB",
            barcode: "8800112233443",
            price: 1899.0,
            costPrice: 1400.0,
            stock: 18,
            lowStockAlert: 5,
          },
          {
            name: "64GB RAM / 2TB SSD — Matte Silver",
            sku: "PBX16-64-2TB",
            barcode: "8800112233444",
            price: 2399.0,
            costPrice: 1750.0,
            stock: 9,
            lowStockAlert: 5,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 3: Fast-Moving Audio Gear
  const ancHeadphones = await prisma.product.create({
    data: {
      name: "SonicPulse ANC Studio Headphones",
      slug: "sonicpulse-anc-studio-headphones",
      categoryId: audioGear.id,
      shortDesc:
        "Adaptive hybrid noise cancellation, 45-hour battery, and lossless spatial audio.",
      description:
        "Block out the world with SonicPulse ANC. Featuring custom 40mm beryllium drivers, plush memory-foam ear cushions, and multipoint Bluetooth 5.4 connectivity.",
      basePrice: 299.0,
      isFeatured: true,
      isHot: true,
      hotScore: 82,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80",
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: "Obsidian Black",
            sku: "SP-ANC-BLK",
            price: 299.0,
            costPrice: 140.0,
            stock: 6, // Low stock warning candidate
            lowStockAlert: 10,
          },
          {
            name: "Cloud Silver",
            sku: "SP-ANC-SLV",
            price: 299.0,
            costPrice: 140.0,
            stock: 22,
            lowStockAlert: 10,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 4: Smart Watch
  const smartWatch = await prisma.product.create({
    data: {
      name: "ChronoFit Ultra Titanium Watch",
      slug: "chronofit-ultra-titanium-watch",
      categoryId: wearables.id,
      shortDesc:
        "Dual-frequency GPS, sapphire crystal glass, ECG sensor, and 100m water resistance.",
      description:
        "Engineered for endurance athletes and everyday adventurers. Tracks heart rate variability, blood oxygen, sleep stages, and elevation with clinical precision.",
      basePrice: 449.0,
      isFeatured: false,
      isHot: false,
      hotScore: 64,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&q=80",
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: "49mm Titanium Case — Alpine Loop",
            sku: "CF-ULTRA-49-ALP",
            price: 449.0,
            costPrice: 260.0,
            stock: 30,
            lowStockAlert: 8,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 5: Galaxy Flagship
  const galaxyUltra = await prisma.product.create({
    data: {
      name: "Galaxy S26 Ultra 5G",
      slug: "galaxy-s26-ultra-5g",
      categoryId: mobilePhones.id,
      shortDesc:
        "200MP quad-telephoto camera, integrated S-Pen, and Dynamic AMOLED 2X display.",
      description:
        "Unleash mobile productivity and AI photo editing with the Galaxy S26 Ultra. Features anti-reflective Gorilla Armor glass and a 5000mAh intelligent battery.",
      basePrice: 1199.0,
      isFeatured: true,
      isHot: false,
      hotScore: 76,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1000&q=80",
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: "256GB — Phantom Black",
            sku: "GS26U-256-BLK",
            price: 1199.0,
            costPrice: 860.0,
            stock: 15,
            lowStockAlert: 8,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 6: Intentionally Slow-Moving / Overstocked Item (So AI recommends discounting it)
  const techBackpack = await prisma.product.create({
    data: {
      name: "Nomad Pro Waterproof Tech Backpack",
      slug: "nomad-pro-waterproof-tech-backpack",
      categoryId: fashion.id,
      shortDesc:
        "Ballistic nylon shell, TSA-ready 16-inch laptop compartment, and magnetic buckles.",
      description:
        "Weatherproof commuter backpack designed to protect your electronics in heavy rain while keeping cables and power banks neatly organized.",
      basePrice: 149.0,
      isFeatured: false,
      isHot: false,
      hotScore: 15,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&q=80",
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: "24L — Stealth Matte Black",
            sku: "NMD-BP-24L",
            price: 149.0,
            costPrice: 65.0,
            stock: 85, // High stock + 0 sales = AI Overstock/Discount candidate
            lowStockAlert: 10,
          },
        ],
      },
    },
    include: { variants: true },
  });

  console.log("✔ Created 6 Products with multi-variant inventory.");

  // ---------------------------------------------------------------------------
  // 5. CREATE PROMOTIONAL COUPONS
  // ---------------------------------------------------------------------------
  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME15",
        discountType: "PERCENTAGE",
        amount: 15,
        minPurchase: 100,
        startDate: daysAgo(30),
        endDate: daysAgo(-90), // Valid for next 90 days
        usageLimit: 500,
        isActive: true,
      },
      {
        code: "TECH50",
        discountType: "FIXED",
        amount: 50,
        minPurchase: 500,
        startDate: daysAgo(15),
        endDate: daysAgo(-60),
        usageLimit: 100,
        isActive: true,
      },
    ],
  });

  console.log("✔ Created promotional Coupons (WELCOME15, TECH50).");

  // ---------------------------------------------------------------------------
  // 6. SEED HISTORICAL ORDERS ACROSS LAST 30 DAYS (Populates Recharts & AI)
  // ---------------------------------------------------------------------------
  const historicalOrderSpecs = [
    {
      daysBack: 28,
      user: customer1,
      variant: iphone17.variants[0],
      qty: 1,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 25,
      user: customer2,
      variant: macbookPro.variants[0],
      qty: 1,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 22,
      user: customer3,
      variant: ancHeadphones.variants[0],
      qty: 2,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 19,
      user: customer1,
      variant: smartWatch.variants[0],
      qty: 1,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 16,
      user: customer2,
      variant: galaxyUltra.variants[0],
      qty: 1,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 14,
      user: customer3,
      variant: iphone17.variants[0],
      qty: 2,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 12,
      user: customer1,
      variant: ancHeadphones.variants[1],
      qty: 1,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 10,
      user: customer2,
      variant: macbookPro.variants[1],
      qty: 1,
      status: OrderStatus.DELIVERED,
    },
    // Recent 7-day surge (Drives high Hot Score & Velocity)
    {
      daysBack: 6,
      user: customer3,
      variant: iphone17.variants[0],
      qty: 2,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 5,
      user: customer1,
      variant: iphone17.variants[1],
      qty: 1,
      status: OrderStatus.DELIVERED,
    },
    {
      daysBack: 4,
      user: customer2,
      variant: ancHeadphones.variants[0],
      qty: 3,
      status: OrderStatus.SHIPPED,
    },
    {
      daysBack: 3,
      user: customer3,
      variant: macbookPro.variants[0],
      qty: 1,
      status: OrderStatus.SHIPPED,
    },
    {
      daysBack: 2,
      user: customer1,
      variant: galaxyUltra.variants[0],
      qty: 2,
      status: OrderStatus.PROCESSING,
    },
    {
      daysBack: 1,
      user: customer2,
      variant: iphone17.variants[0],
      qty: 2,
      status: OrderStatus.CONFIRMED,
    },
    {
      daysBack: 0,
      user: customer3,
      variant: ancHeadphones.variants[0],
      qty: 2,
      status: OrderStatus.PENDING,
    },
  ];

  for (const spec of historicalOrderSpecs) {
    const itemSubtotal = Number(spec.variant.price) * spec.qty;
    const tax = Math.round(itemSubtotal * 0.05 * 100) / 100;
    const total = itemSubtotal + tax;
    const orderDate = daysAgo(spec.daysBack);

    await prisma.order.create({
      data: {
        userId: spec.user.id,
        status: spec.status,
        total,
        tax,
        shippingFee: 0,
        discount: 0,
        shippingAddress: JSON.stringify({
          fullName: spec.user.name,
          street: "742 Evergreen Terrace",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "United States",
          phone: spec.user.phone || "+1-555-0199",
        }),
        paymentMethod: "CARD",
        isPaid: true,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: [
            {
              variantId: spec.variant.id,
              quantity: spec.qty,
              price: spec.variant.price,
            },
          ],
        },
      },
    });
  }

  console.log("✔ Created 15 historical Orders across the last 30 days.");

  // ---------------------------------------------------------------------------
  // 7. SEED CUSTOMER REVIEWS & WISHLIST ACTIVITY
  // ---------------------------------------------------------------------------
  await prisma.review.createMany({
    data: [
      {
        productId: iphone17.id,
        userId: customer1.id,
        rating: 5,
        comment:
          "The titanium build feels incredible and the battery easily lasts two days.",
        isApproved: true,
      },
      {
        productId: iphone17.id,
        userId: customer2.id,
        rating: 5,
        comment: "Best smartphone camera I have ever used. Fast shipping too!",
        isApproved: true,
      },
      {
        productId: macbookPro.id,
        userId: customer3.id,
        rating: 5,
        comment:
          "Compiles Docker containers and Next.js builds in seconds. Zero fan noise.",
        isApproved: true,
      },
      {
        productId: ancHeadphones.id,
        userId: customer1.id,
        rating: 4,
        comment:
          "Amazing sound quality and noise cancellation, though the carrying case is slightly bulky.",
        isApproved: true,
      },
    ],
  });

  if (customer1.wishlist && customer2.wishlist && customer3.wishlist) {
    await prisma.wishlistItem.createMany({
      data: [
        { wishlistId: customer1.wishlist.id, productId: iphone17.id },
        { wishlistId: customer2.wishlist.id, productId: iphone17.id },
        { wishlistId: customer3.wishlist.id, productId: iphone17.id },
        { wishlistId: customer1.wishlist.id, productId: macbookPro.id },
        { wishlistId: customer2.wishlist.id, productId: ancHeadphones.id },
      ],
    });
  }

  console.log("✔ Created Reviews and Wishlist activity.");
  console.log("🎉 Database seeding complete! Run `npm run dev` to explore.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
