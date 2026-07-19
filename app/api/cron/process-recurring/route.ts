import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { processRecurring } from "@/lib/actions/recurring";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processRecurring();
    revalidatePath("/");
    revalidatePath("/autopay");
    revalidatePath("/transactions");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Recurring processing cron failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
