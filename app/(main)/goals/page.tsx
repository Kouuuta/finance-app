import { createClient } from "@/lib/supabase/server";
import { getGoals, getAccounts } from "@/lib/queries";
import { GoalsContent } from "./GoalsContent";

export default async function Goals() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [goals, accounts] = await Promise.all([
    getGoals(user.id),
    getAccounts(user.id),
  ]);

  return <GoalsContent goals={goals} accounts={accounts} />;
}
