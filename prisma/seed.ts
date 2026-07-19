import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";


const prisma = new PrismaClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function date(y: number, m: number, d: number) {
  return new Date(y, m - 1, d);
}

async function main() {
  let userId: string;

  const existingUser = await prisma.user.findFirst();
  if (existingUser) {
    userId = existingUser.id;
    console.log(`Using existing user: ${userId}`);
  } else {
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: "demo@finance.app",
        password: "demo123456",
        email_confirm: true,
      });
    if (authError || !authUser.user)
      throw new Error(authError?.message ?? "Failed to create auth user");

    userId = authUser.user.id;

    await prisma.user.create({
      data: {
        id: userId,
        email: "demo@finance.app",
        name: "Demo User",
      },
    });
    console.log(`Created user: ${userId}`);
  }

  // Institutions
  const instMap = new Map(
    (
      await Promise.all(
        [
          { name: "GCash", type: "ewallet", icon: "ti-device-mobile" },
          { name: "Maya", type: "ewallet", icon: "ti-device-mobile" },
          { name: "BDO", type: "bank", icon: "ti-building-bank" },
          { name: "BPI", type: "bank", icon: "ti-building-bank" },
          { name: "MariBank", type: "bank", icon: "ti-building-bank" },
          { name: "PSBank", type: "bank", icon: "ti-building-bank" },
          { name: "Atome", type: "bnpl", icon: "ti-credit-card" },
          { name: "Cash", type: "cash", icon: "ti-cash" },
          { name: "Other", type: "other", icon: "ti-wallet" },
        ].map((inst) =>
          prisma.institution.upsert({
            where: { name: inst.name },
            update: {},
            create: inst,
          })
        )
      )
    ).map((i) => [i.name, i])
  );

  // Categories
  const catMap = new Map(
    (
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
            where: { id: `${userId}_${cat.name}` },
            update: {},
            create: {
              userId,
              name: cat.name,
              type: cat.type,
              isDefault: true,
            },
          })
        )
      )
    ).map((c) => [c.name, c])
  );

  // Accounts
  const gcash = await prisma.account.upsert({
    where: { id: `${userId}_gcash` },
    update: { balance: 2500 },
    create: {
      id: `${userId}_gcash`,
      userId,
      name: "GCash",
      type: "ewallet",
      institutionId: instMap.get("GCash")!.id,
      balance: 2500,
    },
  });

  const bdoSavings = await prisma.account.upsert({
    where: { id: `${userId}_bdo_savings` },
    update: { balance: 50000 },
    create: {
      id: `${userId}_bdo_savings`,
      userId,
      name: "BDO Savings",
      type: "savings",
      institutionId: instMap.get("BDO")!.id,
      balance: 50000,
      interestRateAnnual: 3.5,
    },
  });

  const bpiChecking = await prisma.account.upsert({
    where: { id: `${userId}_bpi_checking` },
    update: { balance: 15000 },
    create: {
      id: `${userId}_bpi_checking`,
      userId,
      name: "BPI Checking",
      type: "bank",
      institutionId: instMap.get("BPI")!.id,
      balance: 15000,
    },
  });

  const atome = await prisma.account.upsert({
    where: { id: `${userId}_atome` },
    update: { balance: 1200 },
    create: {
      id: `${userId}_atome`,
      userId,
      name: "Atome",
      type: "bnpl",
      institutionId: instMap.get("Atome")!.id,
      balance: 1200,
    },
  });

  const accountMap = new Map([
    ["gcash", gcash],
    ["bdo_savings", bdoSavings],
    ["bpi_checking", bpiChecking],
    ["atome", atome],
  ]);

  // Transactions — 3 months of data
  const now = new Date();
  const today = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Transactions spanning April–July 2026
  const txns: {
    date: Date;
    accountId: string;
    type: string;
    amount: number;
    categoryName: string;
    note: string;
  }[] = [];

  function addTx(month: number, day: number, opts: {
    account: string;
    type: string;
    amount: number;
    category: string;
    note: string;
  }) {
    if (month < currentMonth || (month === currentMonth && day <= today)) {
      txns.push({
        date: date(currentYear, month, day),
        accountId: accountMap.get(opts.account)!.id,
        type: opts.type,
        amount: opts.amount,
        categoryName: opts.category,
        note: opts.note,
      });
    }
  }

  // April
  addTx(4, 1, { account: "gcash", type: "expense", amount: 850, category: "Transport", note: "MRT reload" });
  addTx(4, 3, { account: "bpi_checking", type: "income", amount: 45000, category: "Salary", note: "April salary" });
  addTx(4, 5, { account: "gcash", type: "expense", amount: 320, category: "Food", note: "Lunch out" });
  addTx(4, 8, { account: "gcash", type: "expense", amount: 180, category: "Coffee", note: "Weekend coffee" });
  addTx(4, 10, { account: "bpi_checking", type: "expense", amount: 3500, category: "Bills", note: "Electric bill" });
  addTx(4, 12, { account: "gcash", type: "expense", amount: 2500, category: "Shopping", note: "New shoes" });
  addTx(4, 15, { account: "gcash", type: "expense", amount: 450, category: "Food", note: "Grocery run" });
  addTx(4, 18, { account: "gcash", type: "expense", amount: 600, category: "Entertainment", note: "Netflix + Spotify" });
  addTx(4, 20, { account: "bdo_savings", type: "transfer", amount: 5000, category: "Savings", note: "Monthly savings transfer" });
  addTx(4, 22, { account: "bpi_checking", type: "expense", amount: 1800, category: "Bills", note: "Internet bill" });
  addTx(4, 25, { account: "gcash", type: "expense", amount: 220, category: "Coffee", note: "Coffee run" });
  addTx(4, 28, { account: "gcash", type: "expense", amount: 1500, category: "Food", note: "Dinner with friends" });

  // May
  addTx(5, 1, { account: "gcash", type: "expense", amount: 850, category: "Transport", note: "MRT reload" });
  addTx(5, 3, { account: "bpi_checking", type: "income", amount: 45000, category: "Salary", note: "May salary" });
  addTx(5, 5, { account: "bpi_checking", type: "income", amount: 8000, category: "Freelance", note: "Web dev project" });
  addTx(5, 6, { account: "gcash", type: "expense", amount: 380, category: "Food", note: "Lunch out" });
  addTx(5, 9, { account: "gcash", type: "expense", amount: 180, category: "Coffee", note: "Weekend coffee" });
  addTx(5, 11, { account: "bpi_checking", type: "expense", amount: 3200, category: "Bills", note: "Electric bill" });
  addTx(5, 15, { account: "gcash", type: "expense", amount: 1200, category: "Shopping", note: "New phone case" });
  addTx(5, 18, { account: "gcash", type: "expense", amount: 600, category: "Entertainment", note: "Netflix + Spotify" });
  addTx(5, 20, { account: "bdo_savings", type: "transfer", amount: 5000, category: "Savings", note: "Monthly savings transfer" });
  addTx(5, 22, { account: "bpi_checking", type: "expense", amount: 1800, category: "Bills", note: "Internet bill" });
  addTx(5, 25, { account: "gcash", type: "expense", amount: 250, category: "Coffee", note: "Coffee run" });
  addTx(5, 28, { account: "atome", type: "expense", amount: 1200, category: "Shopping", note: "Atome installment" });

  // June
  addTx(6, 1, { account: "gcash", type: "expense", amount: 850, category: "Transport", note: "MRT reload" });
  addTx(6, 3, { account: "bpi_checking", type: "income", amount: 45000, category: "Salary", note: "June salary" });
  addTx(6, 5, { account: "gcash", type: "expense", amount: 420, category: "Food", note: "Lunch out" });
  addTx(6, 8, { account: "gcash", type: "expense", amount: 180, category: "Coffee", note: "Weekend coffee" });
  addTx(6, 10, { account: "bpi_checking", type: "expense", amount: 3400, category: "Bills", note: "Electric bill" });
  addTx(6, 12, { account: "gcash", type: "expense", amount: 800, category: "Entertainment", note: "Concert ticket" });
  addTx(6, 15, { account: "gcash", type: "expense", amount: 2800, category: "Shopping", note: "New bag" });
  addTx(6, 18, { account: "gcash", type: "expense", amount: 600, category: "Entertainment", note: "Netflix + Spotify" });
  addTx(6, 20, { account: "bdo_savings", type: "transfer", amount: 5000, category: "Savings", note: "Monthly savings transfer" });
  addTx(6, 22, { account: "bpi_checking", type: "expense", amount: 1800, category: "Bills", note: "Internet bill" });
  addTx(6, 25, { account: "gcash", type: "expense", amount: 200, category: "Coffee", note: "Coffee run" });
  addTx(6, 28, { account: "gcash", type: "expense", amount: 1600, category: "Food", note: "Restaurant date" });

  // July (up to today)
  addTx(7, 1, { account: "gcash", type: "expense", amount: 850, category: "Transport", note: "MRT reload" });
  addTx(7, 3, { account: "bpi_checking", type: "income", amount: 45000, category: "Salary", note: "July salary" });
  addTx(7, 5, { account: "gcash", type: "expense", amount: 350, category: "Food", note: "Lunch out" });
  addTx(7, 8, { account: "gcash", type: "expense", amount: 180, category: "Coffee", note: "Weekend coffee" });
  addTx(7, 10, { account: "bpi_checking", type: "expense", amount: 3200, category: "Bills", note: "Electric bill" });
  addTx(7, 12, { account: "gcash", type: "expense", amount: 750, category: "Entertainment", note: "Movie tickets" });

  // Delete old seed transactions for this user, then insert new ones
  await prisma.transaction.deleteMany({ where: { userId } });

  for (const t of txns) {
    await prisma.transaction.create({
      data: {
        userId,
        accountId: t.accountId,
        categoryId: catMap.get(t.categoryName)?.id,
        amount: t.amount,
        type: t.type,
        note: t.note,
        date: t.date,
      },
    });
  }

  // Savings goal
  await prisma.savingsGoal.upsert({
    where: { id: `${userId}_emergency_fund` },
    update: { currentAmount: 12000 },
    create: {
      id: `${userId}_emergency_fund`,
      userId,
      name: "Emergency Fund",
      targetAmount: 100000,
      currentAmount: 12000,
      deadline: date(2027, 12, 31),
    },
  });

  // Investments
  await prisma.investment.upsert({
    where: { id: `${userId}_ali` },
    update: { currentPrice: 38.5 },
    create: {
      id: `${userId}_ali`,
      userId,
      name: "Ayala Land Inc.",
      type: "stock",
      symbol: "ALI",
      units: 100,
      costBasis: 3550,
      currentPrice: 38.5,
    },
  });

  await prisma.investment.upsert({
    where: { id: `${userId}_btc` },
    update: { currentPrice: 3200000 },
    create: {
      id: `${userId}_btc`,
      userId,
      name: "Bitcoin",
      type: "crypto",
      symbol: "BTC",
      units: 0.5,
      costBasis: 1800000,
      currentPrice: 3200000,
    },
  });

  console.log(`Seed completed: user ${userId}, ${txns.length} transactions, 4 accounts, 1 goal, 2 investments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
