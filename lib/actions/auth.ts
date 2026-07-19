"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user.id;
}

export async function updateProfile(id: string, data: { name?: string }) {
  const userId = await getUserId();
  if (id !== userId) throw new Error("Forbidden");
  await prisma.user.update({ where: { id: userId }, data });
  return { ok: true };
}

export async function ensureUser(id: string, email: string, name?: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    await prisma.user.create({
      data: { id, email, name: name || null },
    });
  }
  return { ok: true };
}
