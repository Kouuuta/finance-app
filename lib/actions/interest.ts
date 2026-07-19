"use server";

import { prisma } from "@/lib/prisma";

export async function accrueInterestForAccount(accountId: string) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });
  if (!account || account.type !== "savings" || !account.interestRateAnnual) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (account.lastInterestAccrualDate) {
    const lastDate = new Date(account.lastInterestAccrualDate);
    lastDate.setHours(0, 0, 0, 0);
    if (lastDate >= today) return;
  }

  const startDate = account.lastInterestAccrualDate
    ? new Date(account.lastInterestAccrualDate)
    : new Date(today);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() + 1);

  const interestCategory = await prisma.category.findFirst({
    where: { userId: account.userId, name: "Interest", type: "income" },
  });

  const cursorDate = new Date(startDate);
  let runningBalance = account.balance;
  while (cursorDate <= today) {
    const dailyInterest =
      (runningBalance * account.interestRateAnnual) / 100 / 365;
    const rounded = Math.round(dailyInterest * 100) / 100;

    if (rounded > 0) {
      await prisma.$transaction([
        prisma.account.update({
          where: { id: accountId },
          data: {
            balance: { increment: rounded },
            lastInterestAccrualDate: cursorDate,
          },
        }),
        prisma.transaction.create({
          data: {
            userId: account.userId,
            accountId,
            categoryId: interestCategory?.id,
            amount: rounded,
            type: "income",
            note: "Daily interest",
            date: cursorDate,
          },
        }),
      ]);
      runningBalance += rounded;
    }

    cursorDate.setDate(cursorDate.getDate() + 1);
  }

}

export async function accrueAllInterest() {
  const savingsAccounts = await prisma.account.findMany({
    where: {
      type: "savings",
      interestRateAnnual: { not: null },
    },
  });

  for (const account of savingsAccounts) {
    await accrueInterestForAccount(account.id);
  }
}
