import Dexie, { type Table } from "dexie";

export interface SyncQueueEntry {
  id?: number;
  action: string;
  args: unknown[];
  timestamp: number;
  retries: number;
}

export class FinanceDB extends Dexie {
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super("FinanceTracker");
    this.version(1).stores({
      syncQueue: "++id,timestamp",
    });
  }
}

export const db = new FinanceDB();
