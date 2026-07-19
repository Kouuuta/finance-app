import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries";
import { DashboardContent } from "./DashboardContent";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await getDashboardData(user.id);

  return <DashboardContent data={data} />;
}
