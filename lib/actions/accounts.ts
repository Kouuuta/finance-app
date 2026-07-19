"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found in database");
  return user.id;
}

export async function createAccount(data: {
  name: string;
  type: string;
  institutionId?: string;
  balance: number;
  interestRateAnnual?: number;
}) {
  const userId = await getUserId();

  if (data.institutionId) {
    const existing = await prisma.account.findFirst({
      where: {
        userId,
        institutionId: data.institutionId,
        type: data.type,
      },
    });
    if (existing) {
      throw new Error(
        "You already have an account of this type at this institution"
      );
    }
  }

  await prisma.account.create({
    data: { userId, ...data },
  });

  revalidatePath("/accounts");
}

export async function updateAccount(
  id: string,
  data: {
    name?: string;
    type?: string;
    balance?: number;
    interestRateAnnual?: number;
  }
) {
  const userId = await getUserId();

  await prisma.account.update({
    where: { id, userId },
    data,
  });

  revalidatePath("/accounts");
}

export async function deleteAccount(id: string) {
  const userId = await getUserId();

  await prisma.account.delete({
    where: { id, userId },
  });

  revalidatePath("/accounts");
}
