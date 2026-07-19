"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBudget(data: {
  categoryId?: string;
  amount: number;
  period: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      categoryId: data.categoryId || null,
      amount: data.amount,
      period: data.period,
    },
  });

  revalidatePath("/");
  revalidatePath("/budget");
  return budget;
}

export async function updateBudget(id: string, data: {
  categoryId?: string | null;
  amount?: number;
  period?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const budget = await prisma.budget.update({
    where: { id, userId: user.id },
    data,
  });

  revalidatePath("/");
  revalidatePath("/budget");
  return budget;
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.budget.delete({ where: { id, userId: user.id } });

  revalidatePath("/");
  revalidatePath("/budget");
}
