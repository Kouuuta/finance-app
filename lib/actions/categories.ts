"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "./auth";

export async function createCategory(data: {
  name: string;
  type: string;
  isDefault?: boolean;
}) {
  const userId = await getUserId();

  const existing = await prisma.category.findFirst({
    where: { userId, name: data.name },
  });
  if (existing) throw new Error("A category with this name already exists");

  await prisma.category.create({
    data: { userId, ...data, isDefault: data.isDefault ?? false },
  });

  revalidatePath("/categories");
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    type?: string;
    isDefault?: boolean;
  }
) {
  const userId = await getUserId();

  if (data.name) {
    const existing = await prisma.category.findFirst({
      where: { userId, name: data.name, id: { not: id } },
    });
    if (existing) throw new Error("A category with this name already exists");
  }

  await prisma.category.update({
    where: { id_userId: { id, userId } },
    data,
  });

  revalidatePath("/categories");
}

export async function deleteCategory(id: string) {
  const userId = await getUserId();

  const txnCount = await prisma.transaction.count({
    where: { categoryId: id, userId },
  });
  if (txnCount > 0) {
    throw new Error(
      `Cannot delete — ${txnCount} transaction${txnCount === 1 ? "" : "s"} use${txnCount === 1 ? "s" : ""} this category`
    );
  }

  await prisma.category.delete({
    where: { id_userId: { id, userId } },
  });

  revalidatePath("/categories");
}
