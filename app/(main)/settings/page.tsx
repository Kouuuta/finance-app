import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import SettingsContent from "./SettingsContent";

export default async function Settings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  return (
    <SettingsContent
      userId={user.id}
      name={profile?.name ?? null}
      email={profile?.email ?? user.email ?? ""}
    />
  );
}
