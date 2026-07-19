import { format } from "date-fns";
import { prisma } from "./prisma";
import { accrueInterestForAccount } from "./actions/interest";

export async function getDashboardData(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: { institution: true },
  });

  await Promise.all(
    accounts
      .filter((a) => a.type === "savings" && a.interestRateAnnual)
      .map((a) => accrueInterestForAccount(a.id))
  );

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const investments = await prisma.investment.findMany({ where: { userId } });

  const netWorth =
    accounts.reduce(
      (sum, a) => sum + (a.type === "bnpl" ? -a.balance : a.balance),
      0
    ) + investments.reduce((sum, i) => sum + i.units * i.currentPrice, 0);

  const monthlyIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const monthlyExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const name = t.category?.name ?? "Uncategorized";
        acc[name] = (acc[name] ?? 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>
    );

  const sortedTxs = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  function txNetEffect(t: typeof transactions[0]) {
    if (t.type === "expense") return -t.amount;
    if (t.type === "income") return t.amount;
    return 0;
  }
  const totalEffect = sortedTxs.reduce((s, t) => s + txNetEffect(t), 0);
  let running = netWorth - totalEffect;
  const byDay = new Map<string, typeof sortedTxs>();
  for (const t of sortedTxs) {
    const key = format(t.date, "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(t);
  }
  const netWorthHistory: { date: string; value: number }[] = [];
  const dayKeys = [...byDay.keys()].sort();
  if (dayKeys.length > 0) {
    const first = new Date(dayKeys[0]);
    first.setDate(first.getDate() - 1);
    netWorthHistory.push({ date: format(first, "MMM d"), value: Math.round(running * 100) / 100 });
  }
  for (const key of dayKeys) {
    for (const t of byDay.get(key)!) running += txNetEffect(t);
    netWorthHistory.push({ date: format(new Date(key), "MMM d"), value: Math.round(running * 100) / 100 });
  }

  return {
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: a.balance,
      institutionLogo: a.institution?.logoUrl ?? null,
      interestRateAnnual: a.interestRateAnnual ?? null,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      accountId: t.accountId,
      category: t.category?.name ?? "Uncategorized",
      type: t.type,
      amount: t.amount,
      note: t.note ?? "",
      date: t.date.toISOString(),
    })),
    investments: investments.map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      symbol: i.symbol,
      units: i.units,
      costBasis: i.costBasis,
      currentPrice: i.currentPrice,
    })),
    netWorth,
    netWorthHistory,
    monthlyIncome,
    monthlyExpense,
    expenseBreakdown: Object.entries(expenseByCategory).map(
      ([name, value]) => ({ name, value })
    ),
  };
}

export async function getAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    include: { institution: true },
  });
}

export async function getTransactions(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return transactions.map((t) => ({
    id: t.id,
    accountId: t.accountId,
    category: t.category?.name ?? "Uncategorized",
    type: t.type,
    amount: t.amount,
    note: t.note ?? "",
    date: t.date.toISOString(),
  }));
}

export async function getGoals(userId: string) {
  const goals = await prisma.savingsGoal.findMany({ where: { userId } });
  return goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    deadline: g.deadline?.toISOString() ?? null,
  }));
}

export async function getInvestments(userId: string) {
  return prisma.investment.findMany({ where: { userId } });
}

export async function getFormOptions(userId: string) {
  const [accounts, categories, institutions] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      include: { institution: true },
    }),
    prisma.category.findMany({ where: { userId } }),
    prisma.institution.findMany(),
  ]);

  await Promise.all(
    accounts
      .filter((a) => a.type === "savings" && a.interestRateAnnual)
      .map((a) => accrueInterestForAccount(a.id))
  );

  return { accounts, categories, institutions };
}
