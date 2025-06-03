import { CurrencyDefinition } from './types';

export const LOCAL_STORAGE_TRANSACTIONS_PREFIX = 'clarityLedgerTransactions_';
export const LOCAL_STORAGE_OPENROUTER_API_KEY = 'clarityLedgerOpenRouterApiKey';
export const DEFAULT_USER_ID = 'default_clarityLedger_user';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Utilities', 'Housing', 
  'Entertainment', 'Health', 'Shopping', 'Education', 'Travel', 'Other'
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary', 'Bonus', 'Investment', 'Gift', 'Other'
];

// Keys for custom categories
export const LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES = 'clarityLedgerCustomIncomeCategories';
export const LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES = 'clarityLedgerCustomExpenseCategories';

// Key for budgets
export const LOCAL_STORAGE_BUDGETS_KEY = 'clarityLedgerBudgets';

// Key for Recurring Transactions
export const LOCAL_STORAGE_RECURRING_TRANSACTIONS_KEY = 'clarityLedgerRecurringTransactions';
export const LAST_RECURRING_PROCESSING_TIME_KEY = 'clarityLedgerLastRecurringProcessingTime';


export const LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL = 'clarityLedgerSelectedOpenRouterModel';
export const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-chat:free';

// For AppContext
export const LOCAL_STORAGE_LANGUAGE_KEY = 'clarityLedgerLanguage';
export const LOCAL_STORAGE_DARK_MODE_KEY = 'clarityLedgerDarkMode';
export const LOCAL_STORAGE_SELECTED_CURRENCY_KEY = 'clarityLedgerSelectedCurrency';

export type Language = 'en' | 'zh-TW';
export const DEFAULT_LANGUAGE: Language = 'en';

// Currency Settings
export const AVAILABLE_CURRENCIES: CurrencyDefinition[] = [
  { code: 'USD', symbol: '$', nameKey: 'currencies.USD' },
  { code: 'EUR', symbol: '€', nameKey: 'currencies.EUR' },
  { code: 'JPY', symbol: '¥', nameKey: 'currencies.JPY' },
  { code: 'GBP', symbol: '£', nameKey: 'currencies.GBP' },
  { code: 'AUD', symbol: 'A$', nameKey: 'currencies.AUD' },
  { code: 'CAD', symbol: 'C$', nameKey: 'currencies.CAD' },
  { code: 'CNY', symbol: '¥', nameKey: 'currencies.CNY' },
  { code: 'TWD', symbol: 'NT$', nameKey: 'currencies.TWD' },
  { code: 'HKD', symbol: 'HK$', nameKey: 'currencies.HKD' },
];

export const DEFAULT_CURRENCY_CODE = 'USD';

// OCR Specific AI Model
export const LOCAL_STORAGE_OCR_OPENROUTER_MODEL = 'clarityLedgerOcrOpenRouterModel';
// Qwen VL models are strong multimodal models.
export const DEFAULT_OCR_OPENROUTER_MODEL = 'qwen/qwen2.5-vl-72b-instruct:free';
// Other options could include:
// 'anthropic/claude-3-haiku-20240307'
// 'llava-hf/llava-1.5-7b-hf'
// A fast text-only model if image context is not sent, e.g., 'mistralai/mistral-7b-instruct'