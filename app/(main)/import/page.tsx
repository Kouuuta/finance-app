import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ImportContent } from "./ImportContent";

export default async function Import() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ImportContent
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name, type: c.type }))}
    />
  );
}
