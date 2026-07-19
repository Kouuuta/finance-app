import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AutopayContent } from "./AutopayContent";

export default async function AutopayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [autopay, accounts, categories] = await Promise.all([
    prisma.recurringTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.account.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, type: true },
    }),
  ]);

  return (
    <AutopayContent
      autopay={autopay.map((r) => ({
        ...r,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate?.toISOString() ?? null,
        lastProcessed: r.lastProcessed?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      }))}
      accounts={accounts}
      categories={categories}
    />
  );
}
