"use server";

import { createTransaction, updateTransaction, deleteTransaction } from "./transactions";
import { createAccount, updateAccount, deleteAccount } from "./accounts";
import { createCategory, updateCategory, deleteCategory } from "./categories";
import { createInvestment, updateInvestmentPrice, deleteInvestment } from "./investments";
import { createGoal, deleteGoal, contributeToGoal } from "./goals";
import { createImportTransactions } from "./import";
import { createRecurring, updateRecurring, deleteRecurring } from "./recurring";
import { createBudget, updateBudget, deleteBudget } from "./budgets";

const registry: Record<string, (...args: any[]) => Promise<any>> = {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createAccount,
  updateAccount,
  deleteAccount,
  createCategory,
  updateCategory,
  deleteCategory,
  createInvestment,
  updateInvestmentPrice,
  deleteInvestment,
  createGoal,
  deleteGoal,
  contributeToGoal,
  createImportTransactions,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  createBudget,
  updateBudget,
  deleteBudget,
};

export async function replay(action: string, ...args: unknown[]) {
  const fn = registry[action];
  if (!fn) throw new Error(`Unknown action: ${action}`);
  return fn(...args);
}
