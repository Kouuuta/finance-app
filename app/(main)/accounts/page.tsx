import { createClient } from "@/lib/supabase/server";
import { getFormOptions } from "@/lib/queries";
import { AccountsContent } from "./AccountsContent";

export default async function Accounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { accounts, institutions } = await getFormOptions(user.id);

  return <AccountsContent accounts={accounts} institutions={institutions} />;
}
