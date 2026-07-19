import { prisma } from "@/lib/prisma";
import { getFormOptions, getTransactions } from "@/lib/queries";
import { TransactionsContent } from "./TransactionsContent";

export default async function Transactions() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const { accounts, categories } = await getFormOptions(user.id);
  const transactions = await getTransactions(user.id);

  return (
    <TransactionsContent
      initialTransactions={transactions}
      accounts={accounts}
      categories={categories}
    />
  );
}
