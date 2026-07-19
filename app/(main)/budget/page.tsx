import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from "date-fns";
import { BudgetContent } from "./BudgetContent";

function getPeriodRange(period: string) {
  const now = new Date();
  switch (period) {
    case "weekly":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "monthly":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "yearly":
      return { start: startOfYear(now), end: endOfYear(now) };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export default async function BudgetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [budgets, categories, transactions] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: user.id },
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, type: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, type: "expense" },
      select: { amount: true, categoryId: true, date: true },
    }),
  ]);

  const budgetsWithSpent = budgets.map((b) => {
    const { start, end } = getPeriodRange(b.period);
    const matched = transactions.filter((t) => {
      if (t.date < start || t.date > end) return false;
      if (b.categoryId) return t.categoryId === b.categoryId;
      return true;
    });
    const spent = matched.reduce((s, t) => s + t.amount, 0);
    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.category?.name ?? null,
      amount: b.amount,
      period: b.period,
      spent: Math.round(spent * 100) / 100,
    };
  });

  return (
    <BudgetContent
      budgets={budgetsWithSpent}
      categories={categories}
    />
  );
}
