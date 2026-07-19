import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFormOptions, getTransactions } from "@/lib/queries";
import { TransactionsContent } from "./TransactionsContent";

export default async function Transactions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { accounts, categories } = await getFormOptions(user.id);
  const transactions = await getTransactions(user.id);

  return (
    <TransactionsContent
      initialTransactions={transactions}
      accounts={accounts}
      categories={categories}
      totalCount={transactions.length}
    />
  );
}
