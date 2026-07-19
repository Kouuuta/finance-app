"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "./auth";

export async function createRecurring(data: {
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  amount: number;
  type: string;
  note?: string;
  tags?: string;
  frequency: string;
  interval: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  monthOfYear?: number;
  startDate: Date;
  endDate?: Date;
}) {
  const userId = await getUserId();

  await prisma.recurringTransaction.create({
    data: {
      userId,
      accountId: data.accountId,
      toAccountId: data.toAccountId,
      categoryId: data.categoryId,
      amount: data.amount,
      type: data.type,
      note: data.note,
      tags: data.tags,
      frequency: data.frequency,
      interval: data.interval,
      dayOfMonth: data.dayOfMonth,
      dayOfWeek: data.dayOfWeek,
      monthOfYear: data.monthOfYear,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });

  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function updateRecurring(
  id: string,
  data: {
    accountId?: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    amount?: number;
    type?: string;
    note?: string | null;
    tags?: string | null;
    frequency?: string;
    interval?: number;
    dayOfMonth?: number | null;
    dayOfWeek?: number | null;
    monthOfYear?: number | null;
    startDate?: Date;
    endDate?: Date | null;
    isActive?: boolean;
  }
) {
  const userId = await getUserId();

  await prisma.recurringTransaction.update({
    where: { id_userId: { id, userId } },
    data,
  });

  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function deleteRecurring(id: string) {
  const userId = await getUserId();

  await prisma.recurringTransaction.delete({
    where: { id_userId: { id, userId } },
  });

  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function processRecurring() {
  const now = new Date();

  const rules = await prisma.recurringTransaction.findMany({
    where: { isActive: true },
    include: { user: true },
  });

  for (const rule of rules) {
    const shouldProcess = shouldProcessRule(rule, now);
    if (!shouldProcess) continue;

    await prisma.transaction.create({
      data: {
        userId: rule.userId,
        accountId: rule.accountId,
        toAccountId: rule.toAccountId,
        categoryId: rule.categoryId,
        amount: rule.amount,
        type: rule.type,
        note: rule.note ? `[Recurring] ${rule.note}` : "[Recurring]",
        tags: rule.tags,
        date: now,
      },
    });

    const delta = rule.type === "transfer"
      ? undefined
      : rule.type === "income" ? rule.amount : -rule.amount;

    if (rule.type === "transfer") {
      if (rule.toAccountId) {
        await prisma.account.update({
          where: { id_userId: { id: rule.accountId, userId: rule.userId } },
          data: { balance: { decrement: rule.amount } },
        });
        await prisma.account.update({
          where: { id_userId: { id: rule.toAccountId, userId: rule.userId } },
          data: { balance: { increment: rule.amount } },
        });
      }
    } else if (delta !== undefined) {
      await prisma.account.update({
        where: { id_userId: { id: rule.accountId, userId: rule.userId } },
        data: { balance: { increment: delta } },
      });
    }

    await prisma.recurringTransaction.update({
      where: { id: rule.id },
      data: { lastProcessed: now },
    });
  }

  return { processed: rules.length };
}

function shouldProcessRule(
  rule: {
    frequency: string;
    interval: number;
    dayOfMonth: number | null;
    dayOfWeek: number | null;
    monthOfYear: number | null;
    startDate: Date;
    endDate: Date | null;
    lastProcessed: Date | null;
  },
  now: Date
): boolean {
  if (rule.endDate && now > rule.endDate) return false;
  if (now < rule.startDate) return false;

  if (rule.lastProcessed) {
    const nextDue = getNextDueDate(rule, rule.lastProcessed);
    if (now < nextDue) return false;
  }

  return true;
}

function getNextDueDate(
  rule: {
    frequency: string;
    interval: number;
    dayOfMonth: number | null;
    dayOfWeek: number | null;
    monthOfYear: number | null;
  },
  from: Date
): Date {
  const d = new Date(from);

  switch (rule.frequency) {
    case "daily":
      d.setDate(d.getDate() + rule.interval);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7 * rule.interval);
      if (rule.dayOfWeek !== null) {
        d.setDate(d.getDate() + (rule.dayOfWeek - d.getDay() + 7) % 7);
      }
      break;
    case "monthly":
      d.setMonth(d.getMonth() + rule.interval);
      if (rule.dayOfMonth !== null) {
        d.setDate(Math.min(rule.dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth())));
      }
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + rule.interval);
      if (rule.monthOfYear !== null) {
        d.setMonth(rule.monthOfYear - 1);
        if (rule.dayOfMonth !== null) {
          d.setDate(Math.min(rule.dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth())));
        }
      }
      break;
  }

  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
