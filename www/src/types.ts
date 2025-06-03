export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  userId: string; // Will be populated with DEFAULT_USER_ID
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string format (e.g., YYYY-MM-DD)
  tags?: string[]; // Added for transaction tags
}

export interface PieChartData {
  name: string;
  value: number;
}

export interface CurrencyDefinition {
  code: string; // e.g., USD
  symbol: string; // e.g., $
  nameKey: string; // Translation key for the name, e.g., "currencies.USD"
}

export interface Budget {
  id: string;
  userId: string;
  category: string; // Original category name (not translated)
  targetAmount: number;
  monthYear: string; // Format YYYY-MM, e.g., "2023-10"
  allowRollover?: boolean; // New field for budget rollover
  // spentAmount is calculated dynamically and not stored here
}

// For Recurring Transactions
export enum RecurringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD, optional
  nextDueDate: string; // YYYY-MM-DD
  tags?: string[];
  lastGeneratedDate?: string | null; // YYYY-MM-DD, when an instance was last created
  isActive: boolean; // To mark if it should continue generating
}

// Used by budget service to return richer budget objects
export interface BudgetWithDetails extends Budget {
  spentAmount: number;
  rolloverAmount: number;
  effectiveTargetAmount: number;
}