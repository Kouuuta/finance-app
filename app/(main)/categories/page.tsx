import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CategoriesContent } from "./CategoriesContent";

export default async function Categories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return <CategoriesContent categories={categories} />;
}
