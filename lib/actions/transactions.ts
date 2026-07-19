"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found in database");
  return user.id;
}

export async function createTransaction(data: {
  accountId: string;
  categoryId?: string;
  amount: number;
  type: string;
  note?: string;
  date: Date;
}) {
  const userId = await getUserId();

  const tx = await prisma.transaction.create({
    data: { userId, ...data },
  });

  const delta = data.type === "income" ? data.amount : -data.amount;
  await prisma.account.update({
    where: { id: data.accountId },
    data: { balance: { increment: delta } },
  });

  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId();

  const tx = await prisma.transaction.findUnique({
    where: { id, userId },
  });
  if (!tx) throw new Error("Not found");

  const delta = tx.type === "income" ? tx.amount : -tx.amount;
  await prisma.account.update({
    where: { id: tx.accountId },
    data: { balance: { increment: -delta } },
  });

  await prisma.transaction.delete({ where: { id, userId } });

  revalidatePath("/transactions");
  revalidatePath("/");
}
