// src/services/budgetService.ts
import { Budget, Transaction, TransactionType, BudgetWithDetails } from '../types';
import { LOCAL_STORAGE_BUDGETS_KEY, DEFAULT_USER_ID } from '../constants';

// Helper function to get all budgets for the current user from local storage
const getAllUserBudgetsInternal = (): Budget[] => {
  const storedData = localStorage.getItem(LOCAL_STORAGE_BUDGETS_KEY);
  if (storedData) {
    try {
      const allBudgets: Budget[] = JSON.parse(storedData);
      // Filter for the current user, though in this simple app, it's always DEFAULT_USER_ID
      return allBudgets.filter(budget => budget.userId === DEFAULT_USER_ID);
    } catch (e) {
      console.error("Error parsing budgets from local storage:", e);
      return [];
    }
  }
  return [];
};

// Helper function to save all budgets for the current user to local storage
const saveUserBudgetsInternal = (budgets: Budget[]): void => {
  try {
    // Ensure all budgets being saved are for the default user.
    const budgetsToSave = budgets.map(b => ({ ...b, userId: DEFAULT_USER_ID }));
    localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(budgetsToSave));
  } catch (e) {
    console.error("Error saving budgets to local storage:", e);
  }
};

/**
 * Retrieves all budgets for the current user.
 * @returns An array of all budgets.
 */
export const getAllBudgets = (): Budget[] => {
  return getAllUserBudgetsInternal();
};


/**
 * Retrieves all budgets for a specific month (YYYY-MM) with calculated spent, rollover, and effective target amounts.
 * @param monthYear The month and year string, e.g., "2023-10".
 * @param allTransactions All transactions for calculations.
 * @param allUserBudgets All budgets for the user for rollover calculation.
 * @returns An array of BudgetWithDetails for that month.
 */
export const getBudgetsForMonthWithRollover = (monthYear: string, allTransactions: Transaction[], allUserBudgets: Budget[]): BudgetWithDetails[] => {
  const budgetsForCurrentMonth = allUserBudgets.filter(budget => budget.monthYear === monthYear);

  return budgetsForCurrentMonth.map(budget => {
    const spentForCurrentMonth = allTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category === budget.category && t.date.startsWith(budget.monthYear))
      .reduce((sum, t) => sum + t.amount, 0);

    let rolloverAmount = 0;
    let effectiveTargetAmount = budget.targetAmount;

    if (budget.allowRollover) {
      const prevMonthDate = new Date(budget.monthYear + '-01T00:00:00Z'); // Ensure UTC context if dates are sensitive
      prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
      const prevMonthYearStr = prevMonthDate.toISOString().slice(0, 7);
      
      const prevMonthBudget = allUserBudgets.find(b => b.category === budget.category && b.monthYear === prevMonthYearStr && b.allowRollover);

      if (prevMonthBudget) {
        const spentInPrevMonth = allTransactions
          .filter(t => t.type === TransactionType.EXPENSE && t.category === prevMonthBudget.category && t.date.startsWith(prevMonthBudget.monthYear))
          .reduce((sum, t) => sum + t.amount, 0);
        rolloverAmount = prevMonthBudget.targetAmount - spentInPrevMonth;
        effectiveTargetAmount += rolloverAmount;
      }
    }
    return { 
      ...budget, 
      spentAmount: spentForCurrentMonth, 
      effectiveTargetAmount: Math.max(0, effectiveTargetAmount), // Effective target cannot be negative
      rolloverAmount 
    };
  });
};


/**
 * Adds a new budget.
 * @param budgetData The budget data to add (without id and userId).
 * @returns The newly added budget.
 */
export const addBudget = (budgetData: Omit<Budget, 'id' | 'userId'>): Budget => {
  const allBudgets = getAllUserBudgetsInternal();
  const newBudget: Budget = {
    ...budgetData,
    id: `budget_${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: DEFAULT_USER_ID,
    allowRollover: budgetData.allowRollover || false, // Ensure default
  };
  allBudgets.push(newBudget);
  saveUserBudgetsInternal(allBudgets);
  return newBudget;
};

/**
 * Updates an existing budget.
 * @param updatedBudget The budget with updated information.
 * @returns The updated budget or null if not found.
 */
export const updateBudget = (updatedBudget: Budget): Budget | null => {
  let allBudgets = getAllUserBudgetsInternal();
  const index = allBudgets.findIndex(budget => budget.id === updatedBudget.id && budget.userId === DEFAULT_USER_ID);
  if (index !== -1) {
    allBudgets[index] = { ...updatedBudget, allowRollover: updatedBudget.allowRollover || false };
    saveUserBudgetsInternal(allBudgets);
    return allBudgets[index];
  }
  console.warn(`Budget with id ${updatedBudget.id} not found for update.`);
  return null;
};

/**
 * Deletes a budget by its ID.
 * @param budgetId The ID of the budget to delete.
 */
export const deleteBudget = (budgetId: string): void => {
  let allBudgets = getAllUserBudgetsInternal();
  const initialLength = allBudgets.length;
  const filteredBudgets = allBudgets.filter(budget => !(budget.id === budgetId && budget.userId === DEFAULT_USER_ID));
  if (filteredBudgets.length < initialLength) {
    saveUserBudgetsInternal(filteredBudgets);
  } else {
    console.warn(`Budget with id ${budgetId} not found for deletion.`);
  }
};

/**
 * Saves all budgets for the default user, overwriting existing ones.
 * @param budgetsToSave The array of budgets to save.
 */
export const saveAllUserBudgets = (budgetsToSave: Budget[]): void => {
   const processedBudgets = budgetsToSave.map(b => ({
    ...b,
    allowRollover: b.allowRollover || false, // Ensure new field has default
  }));
  saveUserBudgetsInternal(processedBudgets);
};