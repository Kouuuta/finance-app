import { prisma } from "@/lib/prisma";
import { getInvestments } from "@/lib/queries";
import { InvestmentsContent } from "./InvestmentsContent";

export default async function Investments() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const investments = await getInvestments(user.id);

  return <InvestmentsContent investments={investments} />;
}
