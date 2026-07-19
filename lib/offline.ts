import { enqueue } from "./sync";

export function offlineAction(action: string) {
  return async (...args: unknown[]): Promise<any> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await enqueue(action, ...args);
      return undefined;
    }
    try {
      const { replay } = await import("@/lib/actions/replay");
      return await replay(action, ...args);
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        await enqueue(action, ...args);
        return undefined;
      }
      throw err;
    }
  };
}
