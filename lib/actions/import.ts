"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "./auth";

interface ImportRow {
  date: string;
  amount: number;
  description: string;
  type: "income" | "expense" | "transfer";
  categoryName?: string;
  accountName: string;
  toAccountName?: string;
}

export async function createImportTransactions(rows: ImportRow[]) {
  const userId = await getUserId();

  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId } }),
  ]);

  const findOrCreateCategory = async (name: string, type: string) => {
    const existing = categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.type === type
    );
    if (existing) return existing.id;

    const created = await prisma.category.create({
      data: { userId, name, type, isDefault: false },
    });
    categories.push(created);
    return created.id;
  };

  const results: { row: number; status: "ok" | "skipped" | "error"; message?: string }[] = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const account = accounts.find(
          (a) => a.name.toLowerCase() === row.accountName.toLowerCase()
        );
        if (!account) {
          results.push({ row: i + 1, status: "skipped", message: `Account "${row.accountName}" not found` });
          continue;
        }

        const parsedDate = new Date(row.date);
        if (isNaN(parsedDate.getTime())) {
          results.push({ row: i + 1, status: "skipped", message: `Invalid date "${row.date}"` });
          continue;
        }

        let categoryId: string | undefined;
        if (row.categoryName) {
          categoryId = await findOrCreateCategory(row.categoryName, row.type);
        }

        let toAccountId: string | undefined;
        const toAccountName = row.toAccountName;
        if (toAccountName) {
          const toAccount = accounts.find(
            (a) => a.name.toLowerCase() === toAccountName.toLowerCase()
          );
          if (!toAccount) {
            results.push({ row: i + 1, status: "skipped", message: `Destination account "${row.toAccountName}" not found` });
            continue;
          }
          toAccountId = toAccount.id;
        }

        await tx.transaction.create({
          data: {
            userId,
            accountId: account.id,
            toAccountId,
            categoryId,
            type: row.type,
            amount: row.amount,
            note: row.description,
            date: parsedDate,
          },
        });

        const balanceChange =
          row.type === "expense"
            ? -row.amount
            : row.type === "income"
              ? row.amount
              : 0;

        if (balanceChange !== 0) {
          await tx.account.update({
            where: { id_userId: { id: account.id, userId } },
            data: { balance: { increment: balanceChange } },
          });
        }

        if (toAccountId && row.type === "transfer") {
          await tx.account.update({
            where: { id_userId: { id: toAccountId, userId } },
            data: { balance: { increment: row.amount } },
          });
        }

        results.push({ row: i + 1, status: "ok" });
      } catch (err) {
        results.push({
          row: i + 1,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");

  return results;
}
