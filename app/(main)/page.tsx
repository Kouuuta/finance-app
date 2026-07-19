import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/queries";
import { DashboardContent } from "./DashboardContent";

export default async function Dashboard() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const data = await getDashboardData(user.id);

  return <DashboardContent data={data} />;
}
