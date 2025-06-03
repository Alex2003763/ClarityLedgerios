// src/services/recurringTransactionService.ts
import { RecurringTransaction, RecurringFrequency, TransactionType } from '../types';
import { LOCAL_STORAGE_RECURRING_TRANSACTIONS_KEY, DEFAULT_USER_ID } from '../constants';
import { addTransaction as addActualTransaction } from './transactionService';

const getStorageKey = (): string => `${LOCAL_STORAGE_RECURRING_TRANSACTIONS_KEY}_${DEFAULT_USER_ID}`;

export const getRecurringTransactions = (): RecurringTransaction[] => {
  const storedData = localStorage.getItem(getStorageKey());
  if (storedData) {
    try {
      return JSON.parse(storedData) as RecurringTransaction[];
    } catch (e) {
      console.error("Error parsing recurring transactions:", e);
      return [];
    }
  }
  return [];
};

export const saveAllRecurringTransactions = (transactions: RecurringTransaction[]): void => {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(transactions));
  } catch (e) {
    console.error("Error saving recurring transactions:", e);
  }
};

export const calculateNextDueDate = (currentDueDateStr: string, frequency: RecurringFrequency, startDateStr: string): string => {
    const getSafeDate = (dateStr: string) => { // Handles YYYY-MM-DD format correctly for Date constructor
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    let nextDate = getSafeDate(currentDueDateStr);
    const startDate = getSafeDate(startDateStr);

    switch (frequency) {
        case RecurringFrequency.DAILY:
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case RecurringFrequency.WEEKLY:
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case RecurringFrequency.MONTHLY:
            // Try to maintain the same day of the month.
            // If startDate was e.g. Jan 31, and next month is Feb, it should become Feb 28/29.
            const originalDay = startDate.getDate(); 
            nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1); // Go to first of next month
            const daysInNextMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
            nextDate.setDate(Math.min(originalDay, daysInNextMonth));
            break;
        case RecurringFrequency.YEARLY:
            nextDate = new Date(nextDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
            break;
        default:
            throw new Error(`Unknown frequency: ${frequency}`);
    }
    return nextDate.toISOString().split('T')[0];
};


export const addRecurringTransaction = (data: Omit<RecurringTransaction, 'id' | 'userId' | 'nextDueDate' | 'isActive'>): RecurringTransaction => {
  const transactions = getRecurringTransactions();
  const initialNextDueDate = data.startDate; // First instance is on startDate

  const newTx: RecurringTransaction = {
    ...data,
    id: `rectxn_${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: DEFAULT_USER_ID,
    nextDueDate: initialNextDueDate,
    isActive: true, // New recurring transactions are active by default
    lastGeneratedDate: null,
  };
  transactions.push(newTx);
  saveAllRecurringTransactions(transactions);
  return newTx;
};

export const updateRecurringTransaction = (updatedTx: RecurringTransaction): RecurringTransaction | null => {
  let transactions = getRecurringTransactions();
  const index = transactions.findIndex(tx => tx.id === updatedTx.id);
  if (index !== -1) {
    // If startDate changes, nextDueDate might need recalculation if no instances generated yet
    if (transactions[index].startDate !== updatedTx.startDate && !updatedTx.lastGeneratedDate) {
        updatedTx.nextDueDate = updatedTx.startDate;
    }
    transactions[index] = updatedTx;
    saveAllRecurringTransactions(transactions);
    return updatedTx;
  }
  return null;
};

export const deleteRecurringTransaction = (id: string): void => {
  const transactions = getRecurringTransactions().filter(tx => tx.id !== id);
  saveAllRecurringTransactions(transactions);
};


export const processRecurringTransactions = (): { createdCount: number, errors: string[] } => {
  const allRecurring = getRecurringTransactions();
  const today = new Date().toISOString().split('T')[0];
  let createdCount = 0;
  const errors: string[] = [];

  const updatedRecurringTransactions = allRecurring.map(rtx => {
    if (!rtx.isActive) return rtx; // Skip inactive

    let currentRtx = { ...rtx }; // Work with a copy

    // Loop to catch up on missed due dates
    while (currentRtx.isActive && currentRtx.nextDueDate <= today) {
      // Check endDate
      if (currentRtx.endDate && currentRtx.nextDueDate > currentRtx.endDate) {
        currentRtx.isActive = false; // Deactivate if past end date
        break; // Stop processing this template
      }

      // Avoid creating duplicate if already generated for this nextDueDate
      if (currentRtx.lastGeneratedDate === currentRtx.nextDueDate) {
         // Already generated for this due date, just advance nextDueDate
         console.log(`Instance for ${currentRtx.description} on ${currentRtx.nextDueDate} was already generated. Advancing due date.`);
         try {
            currentRtx.nextDueDate = calculateNextDueDate(currentRtx.nextDueDate, currentRtx.frequency, currentRtx.startDate);
         } catch (e: any) {
            errors.push(`Error calculating next due date for ${currentRtx.description}: ${e.message}`);
            currentRtx.isActive = false; // Deactivate on error
            break;
         }
         continue; // Check new nextDueDate in next iteration of while loop
      }


      // Create the actual transaction
      addActualTransaction({
        description: currentRtx.description,
        amount: currentRtx.amount,
        type: currentRtx.type,
        category: currentRtx.category,
        date: currentRtx.nextDueDate, // Use the actual due date for the transaction
        tags: currentRtx.tags ? [...currentRtx.tags] : [],
      });
      createdCount++;
      
      currentRtx.lastGeneratedDate = currentRtx.nextDueDate; // Mark this due date as processed

      // Calculate the next due date
      try {
        currentRtx.nextDueDate = calculateNextDueDate(currentRtx.nextDueDate, currentRtx.frequency, currentRtx.startDate);
      } catch(e: any) {
        errors.push(`Error calculating next due date for ${currentRtx.description}: ${e.message}`);
        currentRtx.isActive = false; // Deactivate on error
        break; 
      }

      // If new nextDueDate is after endDate, deactivate
      if (currentRtx.endDate && currentRtx.nextDueDate > currentRtx.endDate) {
        currentRtx.isActive = false;
      }
    }
    return currentRtx;
  });

  saveAllRecurringTransactions(updatedRecurringTransactions);
  return { createdCount, errors };
};