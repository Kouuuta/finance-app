"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found in database");
  return user.id;
}

export async function createInvestment(data: {
  name: string;
  type: string;
  symbol: string;
  units: number;
  costBasis: number;
  currentPrice: number;
}) {
  const userId = await getUserId();

  await prisma.investment.create({
    data: { userId, ...data },
  });

  revalidatePath("/investments");
  revalidatePath("/");
}

export async function updateInvestmentPrice(id: string, currentPrice: number) {
  const userId = await getUserId();

  await prisma.investment.update({
    where: { id, userId },
    data: { currentPrice },
  });

  revalidatePath("/investments");
}

export async function deleteInvestment(id: string) {
  const userId = await getUserId();

  await prisma.investment.delete({
    where: { id, userId },
  });

  revalidatePath("/investments");
}
