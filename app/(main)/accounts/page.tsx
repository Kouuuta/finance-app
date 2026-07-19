import { prisma } from "@/lib/prisma";
import { getFormOptions } from "@/lib/queries";
import { AccountsContent } from "./AccountsContent";

export default async function Accounts() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const { accounts, institutions } = await getFormOptions(user.id);

  return <AccountsContent accounts={accounts} institutions={institutions} />;
}
