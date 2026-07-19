"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found in database");
  return user.id;
}

export async function createGoal(data: {
  name: string;
  targetAmount: number;
  deadline?: Date;
}) {
  const userId = await getUserId();

  await prisma.savingsGoal.create({
    data: { userId, ...data },
  });

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function contributeToGoal(
  goalId: string,
  amount: number,
  accountId: string
) {
  const userId = await getUserId();

  const goal = await prisma.savingsGoal.findUnique({
    where: { id: goalId, userId },
  });
  if (!goal) throw new Error("Goal not found");

  await prisma.account.update({
    where: { id: accountId, userId },
    data: { balance: { increment: -amount } },
  });

  await prisma.transaction.create({
    data: {
      userId,
      accountId,
      amount,
      type: "transfer",
      note: `Contribution to ${goal.name}`,
      date: new Date(),
    },
  });

  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: { currentAmount: { increment: amount } },
  });

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteGoal(id: string) {
  const userId = await getUserId();

  await prisma.savingsGoal.delete({
    where: { id, userId },
  });

  revalidatePath("/goals");
}
