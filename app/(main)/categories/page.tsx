import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CategoriesContent } from "./CategoriesContent";

export default async function Categories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return <CategoriesContent categories={categories} />;
}
