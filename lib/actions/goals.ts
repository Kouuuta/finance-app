"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "./auth";

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
    where: { id_userId: { id: goalId, userId } },
  });
  if (!goal) throw new Error("Goal not found");

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id_userId: { id: accountId, userId } },
      data: { balance: { increment: -amount } },
    });

    await tx.transaction.create({
      data: {
        userId,
        accountId,
        amount,
        type: "transfer",
        note: `Contribution to ${goal.name}`,
        date: new Date(),
      },
    });

    await tx.savingsGoal.update({
      where: { id: goalId },
      data: { currentAmount: { increment: amount } },
    });
  });

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteGoal(id: string) {
  const userId = await getUserId();

  await prisma.savingsGoal.delete({
    where: { id_userId: { id, userId } },
  });

  revalidatePath("/goals");
}
