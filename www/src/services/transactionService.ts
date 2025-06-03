// src/services/transactionService.ts
import { Transaction } from '../types';
import { LOCAL_STORAGE_TRANSACTIONS_PREFIX, DEFAULT_USER_ID } from '../constants';

const getStorageKey = (): string => {
  // In a multi-user system, userId would be dynamic.
  // For this app, it's fixed.
  return `${LOCAL_STORAGE_TRANSACTIONS_PREFIX}${DEFAULT_USER_ID}`;
};

/**
 * Retrieves all transactions for the default user.
 * @returns An array of transactions.
 */
export const getTransactions = (): Transaction[] => {
  const storageKey = getStorageKey();
  const storedData = localStorage.getItem(storageKey);
  if (storedData) {
    try {
      return JSON.parse(storedData) as Transaction[];
    } catch (e) {
      console.error("Error parsing transactions from local storage:", e);
      return [];
    }
  }
  return [];
};

/**
 * Saves all transactions for the default user.
 * This overwrites any existing transactions.
 * @param transactions The array of transactions to save.
 */
export const saveTransactions = (transactions: Transaction[]): void => {
  const storageKey = getStorageKey();
  try {
    localStorage.setItem(storageKey, JSON.stringify(transactions));
  } catch (e) {
    console.error("Error saving transactions to local storage:", e);
  }
};

/**
 * Adds a new transaction.
 * @param transactionData The transaction data to add (without id and userId).
 * @returns The newly added transaction.
 */
export const addTransaction = (transactionData: Omit<Transaction, 'id' | 'userId'>): Transaction => {
  const transactions = getTransactions();
  const newTransaction: Transaction = {
    ...transactionData,
    id: `txn_${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: DEFAULT_USER_ID,
  };
  transactions.push(newTransaction);
  saveTransactions(transactions);
  return newTransaction;
};

/**
 * Deletes a transaction by its ID.
 * @param transactionId The ID of the transaction to delete.
 */
export const deleteTransaction = (transactionId: string): void => {
  let transactions = getTransactions();
  const initialLength = transactions.length;
  transactions = transactions.filter(transaction => transaction.id !== transactionId);
  if (transactions.length < initialLength) {
    saveTransactions(transactions);
  } else {
    console.warn(`Transaction with id ${transactionId} not found for deletion.`);
  }
};
