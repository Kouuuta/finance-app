import { db } from "./db";
import { replay } from "@/lib/actions/replay";

export async function enqueue(action: string, ...args: unknown[]) {
  await db.syncQueue.add({
    action,
    args,
    timestamp: Date.now(),
    retries: 0,
  });
}

export async function pending(): Promise<number> {
  return db.syncQueue.count();
}

export async function flush() {
  const entries = await db.syncQueue.orderBy("timestamp").toArray();

  for (const entry of entries) {
    try {
      await replay(entry.action, ...entry.args);
      await db.syncQueue.delete(entry.id!);
    } catch {
      await db.syncQueue.update(entry.id!, {
        retries: entry.retries + 1,
      });
    }
  }
}
