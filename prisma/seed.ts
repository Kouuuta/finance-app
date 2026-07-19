import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@finance.app" },
    update: {},
    create: {
      email: "demo@finance.app",
      passwordHash: "no-auth-mode",
      name: "Demo User",
    },
  });

  await Promise.all(
    [
      { name: "GCash", type: "ewallet", icon: "ti-device-mobile", logoUrl: "/logos/gcash.png" },
      { name: "Maya", type: "ewallet", icon: "ti-device-mobile", logoUrl: "/logos/maya.png" },
      { name: "MariBank", type: "bank", icon: "ti-building-bank", logoUrl: "/logos/maribank.png" },
      { name: "BDO", type: "bank", icon: "ti-building-bank", logoUrl: "/logos/bdo.svg" },
      { name: "BPI", type: "bank", icon: "ti-building-bank", logoUrl: "/logos/bpi.png" },
      { name: "PSBank", type: "bank", icon: "ti-building-bank", logoUrl: "/logos/psbank.png" },
      { name: "Atome", type: "bnpl", icon: "ti-credit-card", logoUrl: "/logos/atome.png" },
      { name: "Cash", type: "cash", icon: "ti-cash" },
      { name: "Other", type: "other", icon: "ti-wallet" },
    ].map((inst) =>
      prisma.institution.upsert({
        where: { name: inst.name },
        update: { logoUrl: inst.logoUrl ?? undefined },
        create: inst,
      })
    )
  );

  await Promise.all(
    [
      { name: "Salary", type: "income" },
      { name: "Freelance", type: "income" },
      { name: "Interest", type: "income" },
      { name: "Food", type: "expense" },
      { name: "Transport", type: "expense" },
      { name: "Bills", type: "expense" },
      { name: "Shopping", type: "expense" },
      { name: "Entertainment", type: "expense" },
      { name: "Coffee", type: "expense" },
      { name: "Savings", type: "transfer" },
    ].map((cat) =>
      prisma.category.upsert({
        where: { id: `${demoUser.id}_${cat.name}` },
        update: {},
        create: {
          userId: demoUser.id,
          name: cat.name,
          type: cat.type,
          isDefault: true,
        },
      })
    )
  );

  console.log("Seed completed: user, institutions, and default categories created. No mock financial data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
