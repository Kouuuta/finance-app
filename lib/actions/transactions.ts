"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "./auth";

export async function createTransaction(data: {
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  amount: number;
  type: string;
  note?: string;
  tags?: string;
  date: Date;
}) {
  const userId = await getUserId();

  if (data.type === "transfer") {
    if (!data.toAccountId) throw new Error("Transfer requires a destination account");
    if (data.toAccountId === data.accountId) throw new Error("Source and destination must be different");
  }

  const tx = await prisma.transaction.create({
    data: {
      userId,
      accountId: data.accountId,
      toAccountId: data.type === "transfer" ? data.toAccountId : undefined,
      categoryId: data.categoryId,
      amount: data.amount,
      type: data.type,
      note: data.note,
      tags: data.tags,
      date: data.date,
    },
  });

  if (data.type === "transfer") {
    await prisma.account.update({
      where: { id_userId: { id: data.accountId, userId } },
      data: { balance: { decrement: data.amount } },
    });
    await prisma.account.update({
      where: { id_userId: { id: data.toAccountId!, userId } },
      data: { balance: { increment: data.amount } },
    });
  } else {
    const delta = data.type === "income" ? data.amount : -data.amount;
    await prisma.account.update({
      where: { id_userId: { id: data.accountId, userId } },
      data: { balance: { increment: delta } },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function updateTransaction(
  id: string,
  data: {
    accountId?: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    amount?: number;
    type?: string;
    note?: string | null;
    tags?: string | null;
    date?: Date;
  }
) {
  const userId = await getUserId();

  const old = await prisma.transaction.findUniqueOrThrow({
    where: { id_userId: { id, userId } },
  });

  // Reverse old balance effects
  if (old.type === "transfer") {
    await prisma.account.update({
      where: { id_userId: { id: old.accountId, userId } },
      data: { balance: { increment: old.amount } },
    });
    if (old.toAccountId) {
      await prisma.account.update({
        where: { id_userId: { id: old.toAccountId, userId } },
        data: { balance: { decrement: old.amount } },
      });
    }
  } else {
    const oldDelta = old.type === "income" ? old.amount : -old.amount;
    await prisma.account.update({
      where: { id_userId: { id: old.accountId, userId } },
      data: { balance: { increment: -oldDelta } },
    });
  }

  const merged = {
    accountId: data.accountId ?? old.accountId,
    toAccountId: data.toAccountId !== undefined ? data.toAccountId : old.toAccountId,
    categoryId: data.categoryId !== undefined ? data.categoryId : old.categoryId,
    amount: data.amount ?? old.amount,
    type: data.type ?? old.type,
    note: data.note !== undefined ? data.note : old.note,
    tags: data.tags !== undefined ? data.tags : old.tags,
    date: data.date ?? old.date,
  };

  // Apply new balance effects
  if (merged.type === "transfer") {
    if (!merged.toAccountId) throw new Error("Transfer requires a destination account");
    if (merged.toAccountId === merged.accountId) throw new Error("Source and destination must be different");
    await prisma.account.update({
      where: { id_userId: { id: merged.accountId, userId } },
      data: { balance: { decrement: merged.amount } },
    });
    await prisma.account.update({
      where: { id_userId: { id: merged.toAccountId, userId } },
      data: { balance: { increment: merged.amount } },
    });
  } else {
    const newDelta = merged.type === "income" ? merged.amount : -merged.amount;
    await prisma.account.update({
      where: { id_userId: { id: merged.accountId, userId } },
      data: { balance: { increment: newDelta } },
    });
  }

  await prisma.transaction.update({
    where: { id_userId: { id, userId } },
    data: merged,
  });

  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId();

  const tx = await prisma.transaction.findUniqueOrThrow({
    where: { id_userId: { id, userId } },
  });

  if (tx.type === "transfer") {
    await prisma.account.update({
      where: { id_userId: { id: tx.accountId, userId } },
      data: { balance: { increment: tx.amount } },
    });
    if (tx.toAccountId) {
      await prisma.account.update({
        where: { id_userId: { id: tx.toAccountId, userId } },
        data: { balance: { decrement: tx.amount } },
      });
    }
  } else {
    const delta = tx.type === "income" ? tx.amount : -tx.amount;
    await prisma.account.update({
      where: { id_userId: { id: tx.accountId, userId } },
      data: { balance: { increment: -delta } },
    });
  }

  await prisma.transaction.delete({ where: { id_userId: { id, userId } } });

  revalidatePath("/transactions");
  revalidatePath("/");
}
