import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInvestments } from "@/lib/queries";
import { InvestmentsContent } from "./InvestmentsContent";

export default async function Investments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const investments = await getInvestments(user.id);

  return <InvestmentsContent investments={investments} />;
}
