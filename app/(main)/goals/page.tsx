import { prisma } from "@/lib/prisma";
import { getGoals, getAccounts } from "@/lib/queries";
import { GoalsContent } from "./GoalsContent";

export default async function Goals() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const [goals, accounts] = await Promise.all([
    getGoals(user.id),
    getAccounts(user.id),
  ]);

  return <GoalsContent goals={goals} accounts={accounts} />;
}
