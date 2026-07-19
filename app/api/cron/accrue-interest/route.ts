import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { accrueAllInterest } from "@/lib/actions/interest";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await accrueAllInterest();
    revalidatePath("/");
    revalidatePath("/accounts");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interest accrual cron failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
