
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { 
  LOCAL_STORAGE_OPENROUTER_API_KEY, 
  LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  Language,
  DEFAULT_LANGUAGE,
  LOCAL_STORAGE_LANGUAGE_KEY,
  LOCAL_STORAGE_DARK_MODE_KEY,
  LOCAL_STORAGE_SELECTED_CURRENCY_KEY,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_USER_ID,
  AVAILABLE_CURRENCIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES,
  LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES,
  LOCAL_STORAGE_BUDGETS_KEY,
  LOCAL_STORAGE_OCR_OPENROUTER_MODEL, 
  DEFAULT_OCR_OPENROUTER_MODEL,
  LOCAL_STORAGE_RECURRING_TRANSACTIONS_KEY // For backup
} from '../../constants';
import { useAppContext } from '../../contexts/AppContext';
import { getTransactions, saveTransactions } from '../../services/transactionService';
import { getAllBudgets, saveAllUserBudgets } from '../../services/budgetService';
import { Transaction, TransactionType, Budget, CurrencyDefinition, RecurringTransaction } from '../../types';
import SettingsIcon from '../ui/SettingsIcon'; 
import CategoryManager from '../settings/CategoryManager';
import { convertTransactionsToCSV, downloadCSV } from '../../services/exportService'; // CSV Export
import { getRecurringTransactions, saveAllRecurringTransactions } from '../../services/recurringTransactionService'; // For backup

// Icons
const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
  </svg>
);
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591" />
  </svg>
);
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
</svg>
);
const LanguageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
  </svg>
);
const DatabaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3v-1.5A2.25 2.25 0 016 0h12A2.25 2.25 0 0120.25 1.5V3M3.75 3H1M3.75 7.5H1M3.75 12H1m19.5 0v.75c0 .621-.504 1.125-1.125 1.125a1.125 1.125 0 01-1.125-1.125v-.75m1.125 0c.094-.317.188-.635.281-.952m-1.688.952a.625.625 0 01-.625-.625V7.5c0-.621.504-1.125 1.125-1.125a1.125 1.125 0 011.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125Z" />
  </svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);
const GlobeAltIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5c-.93 0-1.813-.12-2.662-.35M3.284 14.253A11.978 11.978 0 0 0 12 16.5c.93 0 1.813-.12 2.662-.35m0 0a8.959 8.959 0 0 0 2.662-2.352m0 0a8.997 8.997 0 0 0-7.843-4.582M3.284 7.582A8.997 8.997 0 0 1 12 3" />
    </svg>
);
const TableCellsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5V7.5c0-1.425.824-2.688 2.006-3.201M3.375 19.5c.024-.07.049-.14.076-.21M19.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125S17.25 4.254 17.25 4.875V7.5m2.25 0V18.375c0 .621-.504 1.125-1.125 1.125M19.5 7.5h-1.5M19.5 7.5c-.024.07-.049.14-.076.21M16.5 7.5h-1.5m-12.75-3.128c1.182.513 2.006 1.776 2.006 3.201V7.5M4.5 7.5h1.5m0 0c.024.07.049.14.076.21M7.5 7.5h1.5m0 0c.024.07.049.14.076.21M10.5 7.5h1.5m0 0c.024.07.049.14.076.21M13.5 7.5h1.5m3.75-3.75c.621 0 1.125.504 1.125 1.125M12.75 4.125c-.621 0-1.125.504-1.125 1.125M12.75 4.125V7.5M12.75 4.125c.024-.07.049-.14.076-.21M9.75 4.125c-.621 0-1.125.504-1.125 1.125M9.75 4.125V7.5M9.75 4.125c.024-.07.049-.14.076.21M6.75 4.125c-.621 0-1.125.504-1.125 1.125M6.75 4.125V7.5M6.75 4.125c.024-.07.049-.14.076.21m0 9.75h10.5m-10.5 0V10.5c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v6.375m-10.5 0c.024.07.049.14.076.21m10.5 0c-.024.07.049.14-.076.21" />
    </svg>
);


interface AppSettingsBackup {
  apiKey: string;
  modelName: string;
  ocrModelName: string; 
  language: Language;
  darkMode: boolean;
  selectedCurrency: string;
  customIncomeCategories: string[];
  customExpenseCategories: string[];
}
interface AppBackupData {
  version: string; // e.g., "1.0.2" for new fields
  settings: AppSettingsBackup;
  transactions: Transaction[];
  budgets: Budget[]; // Will now include allowRollover
  recurringTransactions?: RecurringTransaction[]; // New field
}


const SettingsPage: React.FC = () => {
  const { t, language, setLanguage, isDarkMode, setIsDarkMode, selectedCurrencyCode, setSelectedCurrencyCode } = useAppContext();
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState(DEFAULT_OPENROUTER_MODEL);
  const [ocrModelName, setOcrModelName] = useState(DEFAULT_OCR_OPENROUTER_MODEL); 
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error', subText?: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [customIncomeCategories, setCustomIncomeCategories] = useState<string[]>([]);
  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>([]);
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');


  useEffect(() => {
    const storedKey = localStorage.getItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
    setApiKey(storedKey || '');

    const storedModel = localStorage.getItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL);
    setModelName(storedModel === null ? DEFAULT_OPENROUTER_MODEL : storedModel);

    const storedOcrModel = localStorage.getItem(LOCAL_STORAGE_OCR_OPENROUTER_MODEL); 
    setOcrModelName(storedOcrModel === null ? DEFAULT_OCR_OPENROUTER_MODEL : storedOcrModel);

    setCustomIncomeCategories(JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES) || '[]'));
    setCustomExpenseCategories(JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES) || '[]'));
  }, []);

  const handleSaveSettings = () => {
    setIsLoading(true);
    setMessage(null);
    const trimmedApiKey = apiKey.trim();
    const trimmedModelName = modelName.trim();
    const trimmedOcrModelName = ocrModelName.trim(); 

    try {
      if (!trimmedApiKey) {
        localStorage.removeItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
        setApiKey(''); 
        setMessage({ text: t('settingsPage.apiKeyRemovedMessage'), type: 'success' });
      } else {
        localStorage.setItem(LOCAL_STORAGE_OPENROUTER_API_KEY, trimmedApiKey);
        setMessage({ text: t('settingsPage.successMessage'), type: 'success' });
      }
      localStorage.setItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL, trimmedModelName || DEFAULT_OPENROUTER_MODEL);
      setModelName(trimmedModelName || DEFAULT_OPENROUTER_MODEL);

      localStorage.setItem(LOCAL_STORAGE_OCR_OPENROUTER_MODEL, trimmedOcrModelName || DEFAULT_OCR_OPENROUTER_MODEL); 
      setOcrModelName(trimmedOcrModelName || DEFAULT_OCR_OPENROUTER_MODEL);

    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ text: t('settingsPage.failureMessage'), type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as Language);
  };

  const handleCurrencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrencyCode(event.target.value);
    setMessage({ text: t('settingsPage.currencyChangedMessage', {currency: event.target.value}), type: 'success'});
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportData = async () => { 
    setMessage(null);
    try {
      const transactions = getTransactions();
      const budgets = getAllBudgets();
      const recurringTxs = getRecurringTransactions();
      
      const settingsToExport: AppSettingsBackup = {
        apiKey: localStorage.getItem(LOCAL_STORAGE_OPENROUTER_API_KEY) || '',
        modelName: localStorage.getItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL) || DEFAULT_OPENROUTER_MODEL,
        ocrModelName: localStorage.getItem(LOCAL_STORAGE_OCR_OPENROUTER_MODEL) || DEFAULT_OCR_OPENROUTER_MODEL, 
        language: (localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY) || DEFAULT_LANGUAGE) as Language,
        darkMode: localStorage.getItem(LOCAL_STORAGE_DARK_MODE_KEY) === 'true',
        selectedCurrency: localStorage.getItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY) || DEFAULT_CURRENCY_CODE,
        customIncomeCategories: JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES) || '[]'),
        customExpenseCategories: JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES) || '[]'),
      };

      const backupData: AppBackupData = {
        version: "1.0.2", 
        settings: settingsToExport,
        transactions,
        budgets,
        recurringTransactions: recurringTxs,
      };

      const date = new Date().toISOString().split('T')[0];
      const filename = `clarityLedger_backup_${date}.json`;
      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });

      // Try Web Share API first for mobile
      if (navigator.share && typeof navigator.canShare === 'function') {
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: t('settingsPage.exportDataButton'),
              text: `ClarityLedger backup data - ${filename}`,
            });
            setMessage({ text: t('settingsPage.exportSuccessMessageFull', { filename }), type: 'success' });
            setTimeout(() => setMessage(null), 5000);
            return; // Shared successfully
          } catch (shareError) {
            console.warn('Web Share API error:', shareError);
            if ((shareError as DOMException).name === 'AbortError') {
              console.log('Share action was cancelled by the user.');
               setTimeout(() => setMessage(null), 1000);
              return;
            }
            console.warn('Web Share API failed, attempting fallback download.', shareError);
          }
        }
      }

      // Fallback to <a> tag download method
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      setMessage({ text: t('settingsPage.exportSuccessMessageFull', {filename}), type: 'success' });
      setTimeout(() => setMessage(null), 5000);

    } catch (error) {
      console.error("Error exporting data:", error);
      setMessage({ text: t('settingsPage.exportErrorMessage'), type: 'error' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleExportTransactionsCSV = async () => {
    setMessage(null);
    try {
        const transactions = getTransactions();
        if (transactions.length === 0) {
            setMessage({text: t('settingsPage.exportNoTransactionsMessage', {defaultValue: "No transactions to export."}), type: 'error'});
            setTimeout(() => setMessage(null), 3000);
            return;
        }
        const csvData = convertTransactionsToCSV(transactions);
        const date = new Date().toISOString().split('T')[0];
        const filename = `clarityLedger_transactions_${date}.csv`;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

        // Try Web Share API first for mobile
        if (navigator.share && typeof navigator.canShare === 'function') {
            const file = new File([blob], filename, { type: 'text/csv;charset=utf-8;' });
            if (navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: t('settingsPage.exportCsvButton'),
                        text: `ClarityLedger transactions - ${filename}`,
                    });
                    setMessage({text: t('settingsPage.exportCsvSuccessMessage', {filename}), type: 'success'});
                    setTimeout(() => setMessage(null), 5000);
                    return; // Shared successfully
                } catch (shareError) {
                    console.warn('Web Share API error for CSV:', shareError);
                    if ((shareError as DOMException).name === 'AbortError') {
                        console.log('CSV Share action was cancelled by the user.');
                        setTimeout(() => setMessage(null), 1000);
                        return;
                    }
                    console.warn('Web Share API for CSV failed, attempting fallback download.', shareError);
                }
            }
        }
        
        // Fallback to direct download
        downloadCSV(csvData, filename);
        setMessage({text: t('settingsPage.exportCsvSuccessMessage', {filename}), type: 'success'});
        setTimeout(() => setMessage(null), 5000);

    } catch (error) {
        console.error("Error exporting transactions to CSV:", error);
        setMessage({ text: t('settingsPage.exportCsvErrorMessage'), type: 'error' });
        setTimeout(() => setMessage(null), 5000);
    }
  };
  
  const isValidTransactionItem = (item: any): item is Partial<Transaction> => {
    return typeof item === 'object' && item !== null &&
      (typeof item.id === 'string' || item.id === undefined) && 
      (typeof item.userId === 'string' || item.userId === undefined) && 
      typeof item.description === 'string' && item.description.trim() !== '' &&
      typeof item.amount === 'number' && item.amount >= 0 && 
      (item.type === TransactionType.INCOME || item.type === TransactionType.EXPENSE) &&
      typeof item.category === 'string' && item.category.trim() !== '' &&
      typeof item.date === 'string' && !isNaN(new Date(item.date).getTime()) &&
      (Array.isArray(item.tags) ? item.tags.every((tag: any) => typeof tag === 'string') : item.tags === undefined);
  };
  
  const isValidBudgetItem = (item: any): item is Partial<Budget> => {
      return typeof item === 'object' && item !== null &&
          (typeof item.id === 'string' || item.id === undefined) &&
          (typeof item.userId === 'string' || item.userId === undefined) &&
          typeof item.category === 'string' && item.category.trim() !== '' &&
          typeof item.targetAmount === 'number' && item.targetAmount > 0 &&
          typeof item.monthYear === 'string' && item.monthYear.match(/^\d{4}-\d{2}$/) !== null &&
          (typeof item.allowRollover === 'boolean' || item.allowRollover === undefined); // Check new field
  };

  const isValidRecurringTransactionItem = (item: any): item is Partial<RecurringTransaction> => {
    return typeof item === 'object' && item !== null &&
      (typeof item.id === 'string' || item.id === undefined) &&
      (typeof item.userId === 'string' || item.userId === undefined) &&
      typeof item.description === 'string' &&
      typeof item.amount === 'number' && item.amount > 0 &&
      (item.type === TransactionType.INCOME || item.type === TransactionType.EXPENSE) &&
      typeof item.category === 'string' &&
      typeof item.frequency === 'string' && // Add more specific enum check if needed
      typeof item.startDate === 'string' && !isNaN(new Date(item.startDate).getTime()) &&
      (item.endDate === undefined || item.endDate === null || (typeof item.endDate === 'string' && !isNaN(new Date(item.endDate).getTime()))) &&
      typeof item.nextDueDate === 'string' && !isNaN(new Date(item.nextDueDate).getTime()) &&
      (typeof item.isActive === 'boolean' || item.isActive === undefined) &&
      (Array.isArray(item.tags) ? item.tags.every((tag: any) => typeof tag === 'string') : item.tags === undefined);
  };

  const isValidAppBackupData = (data: any): data is AppBackupData => {
    if (typeof data !== 'object' || data === null) {
      console.error("Validation Error: Data is not an object or is null.");
      return false;
    }

    // Allow version 1.0.0, 1.0.1, 1.0.2
    if (!["1.0.0", "1.0.1", "1.0.2"].includes(data.version)) {
      console.error("Validation Error: Invalid version.", data.version);
      return false;
    }

    const settings = data.settings;
    if (typeof settings !== 'object' || settings === null) {
      console.error("Validation Error: Settings block is invalid.");
      return false;
    }
    if (typeof settings.apiKey !== 'string') return false;
    if (typeof settings.modelName !== 'string') return false;
    if ((data.version === "1.0.1" || data.version === "1.0.2") && typeof settings.ocrModelName !== 'string' && settings.ocrModelName !== undefined) return false; 
    if (settings.language !== 'en' && settings.language !== 'zh-TW') return false;
    if (typeof settings.darkMode !== 'boolean') return false;
    if (!AVAILABLE_CURRENCIES.some(c => c.code === settings.selectedCurrency)) return false;
    if (!Array.isArray(settings.customIncomeCategories) || !settings.customIncomeCategories.every((cat: any) => typeof cat === 'string')) return false;
    if (!Array.isArray(settings.customExpenseCategories) || !settings.customExpenseCategories.every((cat: any) => typeof cat === 'string')) return false;

    if (!Array.isArray(data.transactions) || !data.transactions.every(isValidTransactionItem)) {
        console.error("Validation Error: Transactions array is invalid or contains invalid items.");
        return false;
    }
    if (!Array.isArray(data.budgets) || !data.budgets.every(isValidBudgetItem)) {
        console.error("Validation Error: Budgets array is invalid or contains invalid items.");
        return false;
    }
    if (data.version === "1.0.2") {
        if (data.recurringTransactions !== undefined && (!Array.isArray(data.recurringTransactions) || !data.recurringTransactions.every(isValidRecurringTransactionItem))) {
             console.error("Validation Error: Recurring transactions array is invalid or contains invalid items.");
             return false;
        }
    }
    return true;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json') {
        setFileToImport(file);
        setIsImportConfirmModalOpen(true);
      } else {
        setMessage({ text: t('settingsPage.importErrorMessageFile'), type: 'error' });
        setFileToImport(null);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportDataConfirmed = async () => {
    if (!fileToImport) return;

    setIsImporting(true);
    setMessage({ text: t('settingsPage.importProcessingMessage'), type: 'success' });
    setIsImportConfirmModalOpen(false);

    try {
      const fileContent = await fileToImport.text();
      const parsedData = JSON.parse(fileContent);

      if (!isValidAppBackupData(parsedData)) {
        setMessage({ text: t('settingsPage.importErrorMessageValidation'), type: 'error', subText: t('settingsPage.importInvalidDataSubText') });
        setIsImporting(false);
        setFileToImport(null);
        return;
      }
      
      const { settings, transactions, budgets, recurringTransactions } = parsedData;

      localStorage.setItem(LOCAL_STORAGE_OPENROUTER_API_KEY, settings.apiKey);
      setApiKey(settings.apiKey);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL, settings.modelName);
      setModelName(settings.modelName);
      
      const importedOcrModel = settings.ocrModelName || DEFAULT_OCR_OPENROUTER_MODEL;
      localStorage.setItem(LOCAL_STORAGE_OCR_OPENROUTER_MODEL, importedOcrModel);
      setOcrModelName(importedOcrModel);

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, settings.language);
      setLanguage(settings.language);
      localStorage.setItem(LOCAL_STORAGE_DARK_MODE_KEY, String(settings.darkMode));
      setIsDarkMode(settings.darkMode);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY, settings.selectedCurrency);
      setSelectedCurrencyCode(settings.selectedCurrency);
      
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES, JSON.stringify(settings.customIncomeCategories));
      setCustomIncomeCategories(settings.customIncomeCategories);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES, JSON.stringify(settings.customExpenseCategories));
      setCustomExpenseCategories(settings.customExpenseCategories);

      const processedTransactions = transactions.map(tx => ({
        ...tx,
        id: tx.id || `txn_${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: DEFAULT_USER_ID 
      }));
      saveTransactions(processedTransactions);

      const processedBudgets = budgets.map(b => ({
        ...b,
        id: b.id || `budget_${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: DEFAULT_USER_ID,
        allowRollover: b.allowRollover || false // Ensure new field has default
      }));
      saveAllUserBudgets(processedBudgets);

      if (parsedData.version === "1.0.2" && recurringTransactions) {
        const processedRecurringTxs = recurringTransactions.map(rtx => ({
            ...rtx,
            id: rtx.id || `rectxn_${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}`,
            userId: DEFAULT_USER_ID,
            isActive: rtx.isActive === undefined ? true : rtx.isActive,
        }));
        saveAllRecurringTransactions(processedRecurringTxs);
      } else {
        // If importing from an older version without recurring transactions, clear existing ones
        localStorage.removeItem(LOCAL_STORAGE_RECURRING_TRANSACTIONS_KEY);
      }
      
      setMessage({ text: t('settingsPage.importSuccessMessage'), type: 'success', subText: t('settingsPage.importSuccessInfoReload')});

    } catch (error) {
      console.error("Error importing data:", error);
      if (error instanceof SyntaxError) {
          setMessage({ text: t('settingsPage.importErrorMessageFormat'), type: 'error' });
      } else {
          setMessage({ text: t('settingsPage.importErrorMessageFile'), type: 'error' });
      }
    } finally {
      setIsImporting(false);
      setFileToImport(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
      }
      setTimeout(() => {
        if(message?.type !== 'success' || message?.subText !== t('settingsPage.importSuccessInfoReload')) {
            setMessage(null)
        }
      }, 7000);
    }
  };
  
  const handleAddCategory = (type: 'income' | 'expense') => {
    setMessage(null);
    const newCategoryName = type === 'income' ? newIncomeCategory.trim() : newExpenseCategory.trim();
    if (!newCategoryName) {
      setMessage({text: t('settingsPage.customCategories.errorEmptyName'), type: 'error'});
      return;
    }

    const allDefaultCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
    if(allDefaultCategories.some(cat => cat.toLowerCase() === newCategoryName.toLowerCase())) {
      setMessage({text: t('settingsPage.customCategories.errorIsDefault', { categoryName: newCategoryName }), type: 'error'});
      return;
    }

    if (type === 'income') {
      if (customIncomeCategories.some(cat => cat.toLowerCase() === newCategoryName.toLowerCase())) {
        setMessage({text: t('settingsPage.customCategories.errorExists', { categoryName: newCategoryName }), type: 'error'});
        return;
      }
      const updatedCategories = [...customIncomeCategories, newCategoryName];
      setCustomIncomeCategories(updatedCategories);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES, JSON.stringify(updatedCategories));
      setNewIncomeCategory('');
      setMessage({text: t('settingsPage.customCategories.addSuccess', { categoryName: newCategoryName }), type: 'success'});
    } else {
      if (customExpenseCategories.some(cat => cat.toLowerCase() === newCategoryName.toLowerCase())) {
        setMessage({text: t('settingsPage.customCategories.errorExists', { categoryName: newCategoryName }), type: 'error'});
        return;
      }
      const updatedCategories = [...customExpenseCategories, newCategoryName];
      setCustomExpenseCategories(updatedCategories);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES, JSON.stringify(updatedCategories));
      setNewExpenseCategory('');
      setMessage({text: t('settingsPage.customCategories.addSuccess', { categoryName: newCategoryName }), type: 'success'});
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteCategory = (nameToDelete: string, type: 'income' | 'expense') => {
    setMessage(null);
    const transactions = getTransactions();
    const isInUse = transactions.some(tx => tx.category.toLowerCase() === nameToDelete.toLowerCase() && 
                                        ((type === 'income' && tx.type === TransactionType.INCOME) || 
                                         (type === 'expense' && tx.type === TransactionType.EXPENSE)));

    if (isInUse) {
        if (!window.confirm(t('settingsPage.customCategories.confirmDeleteInUse', { categoryName: nameToDelete }))) {
            return;
        }
    }

    if (type === 'income') {
      const updatedCategories = customIncomeCategories.filter(cat => cat.toLowerCase() !== nameToDelete.toLowerCase());
      setCustomIncomeCategories(updatedCategories);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES, JSON.stringify(updatedCategories));
    } else {
      const updatedCategories = customExpenseCategories.filter(cat => cat.toLowerCase() !== nameToDelete.toLowerCase());
      setCustomExpenseCategories(updatedCategories);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES, JSON.stringify(updatedCategories));
    }
    setMessage({text: t('settingsPage.customCategories.deleteSuccess', { categoryName: nameToDelete }), type: 'success'});
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-primary-light flex items-center justify-center">
          <SettingsIcon className="w-8 h-8 sm:w-10 sm:h-10 mr-3 fill-current" />
          {t('settingsPage.title')}
        </h1>
      </header>

      {message && (
        <div className={`p-4 rounded-md text-sm mb-6 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/[0.4] text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/[0.4] text-red-700 dark:text-red-200'}`} role="alert">
          <p className="font-medium">{message.text}</p>
          {message.subText && <p className="text-xs mt-1">{message.subText}</p>}
        </div>
      )}

      {/* API Settings Section */}
      <section className="bg-white dark:bg-darkSurface shadow-xl rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center">
            <KeyIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light" />
            {t('settingsPage.apiSettingsTitle')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('settingsPage.apiSettingsDescription')} <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-primary-light hover:underline">{t('settingsPage.openRouterLink')}</a>.</p>
        
        <Input
          label={t('settingsPage.apiKeyLabel')}
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={t('settingsPage.apiKeyPlaceholder')}
          containerClassName="mb-4"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-4">{t('settingsPage.apiKeyHelp')}</p>
        
        <Input
          label={t('settingsPage.modelNameLabel')}
          id="modelName"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder={t('settingsPage.modelNamePlaceholder')}
          containerClassName="mb-4"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-6">{t('settingsPage.modelNameHelp', {defaultModel: DEFAULT_OPENROUTER_MODEL})}</p>

        <Input
          label={t('settingsPage.ocrModelNameLabel', { defaultValue: 'OCR AI Model Name'})}
          id="ocrModelName"
          value={ocrModelName}
          onChange={(e) => setOcrModelName(e.target.value)}
          placeholder={t('settingsPage.ocrModelNamePlaceholder', { defaultValue: 'e.g., anthropic/claude-3-haiku-20240307' })}
          containerClassName="mb-4"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-6">{t('settingsPage.ocrModelNameHelp', {defaultModel: DEFAULT_OCR_OPENROUTER_MODEL, defaultValue: `Enter model for OCR enhancement (e.g., '${DEFAULT_OCR_OPENROUTER_MODEL}'). If empty, defaults to financial tip model or a specific OCR default.`})}</p>


        <Button onClick={handleSaveSettings} isLoading={isLoading} leftIcon={!isLoading ? <CheckCircleIcon className="w-5 h-5"/> : undefined}>
          {isLoading ? t('settingsPage.savingButton') : t('settingsPage.saveButton')}
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{t('settingsPage.settingsUsageInfo')}</p>
      </section>

      {/* UI Settings Section */}
      <section className="bg-white dark:bg-darkSurface shadow-xl rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
            <GlobeAltIcon className="w-6 h-6 mr-2 text-secondary dark:text-sky-400" />
            {t('settingsPage.uiSettingsTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    <LanguageIcon className="w-5 h-5 mr-2 opacity-70"/> {t('settingsPage.languageLabel')}
                </label>
                <select 
                    id="language-select"
                    value={language} 
                    onChange={handleLanguageChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-darkBorder rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext"
                >
                    <option value="en">{t('settingsPage.english')}</option>
                    <option value="zh-TW">{t('settingsPage.traditionalChinese')}</option>
                </select>
            </div>
            <div>
                <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('settingsPage.currencySettingLabel')}
                </label>
                <select
                    id="currency-select"
                    value={selectedCurrencyCode}
                    onChange={handleCurrencyChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-darkBorder rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext"
                >
                    {AVAILABLE_CURRENCIES.map((currency: CurrencyDefinition) => (
                    <option key={currency.code} value={currency.code}>
                        {`${currency.code} - ${t(currency.nameKey)} (${currency.symbol})`}
                    </option>
                    ))}
                </select>
            </div>
            <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    {isDarkMode ? <MoonIcon className="w-5 h-5 mr-2 opacity-70"/> : <SunIcon className="w-5 h-5 mr-2 opacity-70"/>}
                    {t('settingsPage.darkModeLabel')}
                 </label>
                <Button 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    variant="ghost"
                    className="w-full"
                    leftIcon={isDarkMode ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                >
                    {isDarkMode ? t('settingsPage.switchToLightMode') : t('settingsPage.switchToDarkMode')}
                </Button>
            </div>
        </div>
      </section>

      {/* Category Management Section */}
      <section className="bg-white dark:bg-darkSurface shadow-xl rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('settingsPage.customCategories.title')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('settingsPage.customCategories.description')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryManager
            title={t('settingsPage.customCategories.incomeTitle')}
            categories={DEFAULT_INCOME_CATEGORIES}
            customCategories={customIncomeCategories}
            newCategory={newIncomeCategory}
            setNewCategory={setNewIncomeCategory}
            onAdd={() => handleAddCategory('income')}
            onDelete={(name) => handleDeleteCategory(name, 'income')}
            categoryTypeForTranslation="income"
          />
          <CategoryManager
            title={t('settingsPage.customCategories.expenseTitle')}
            categories={DEFAULT_EXPENSE_CATEGORIES}
            customCategories={customExpenseCategories}
            newCategory={newExpenseCategory}
            setNewCategory={setNewExpenseCategory}
            onAdd={() => handleAddCategory('expense')}
            onDelete={(name) => handleDeleteCategory(name, 'expense')}
            categoryTypeForTranslation="expense"
          />
        </div>
      </section>


      {/* Data Management Section */}
      <section className="bg-white dark:bg-darkSurface shadow-xl rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
            <DatabaseIcon className="w-6 h-6 mr-2 text-accent dark:text-emerald-400"/>
            {t('settingsPage.dataManagementTitle')}
        </h2>
        <div className="space-y-3">
            <Button onClick={handleExportData} variant="primary" leftIcon={<DownloadIcon />} className="w-full">
                {t('settingsPage.exportDataButton')} ({t('settingsPage.exportFormatJson', {defaultValue: "JSON"})})
            </Button>
            <Button onClick={handleExportTransactionsCSV} variant="primary" leftIcon={<TableCellsIcon />} className="w-full">
                {t('settingsPage.exportCsvButton', {defaultValue: "Export Transactions to CSV"})}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" leftIcon={<UploadIcon />} isLoading={isImporting} className="w-full">
                {isImporting ? t('settingsPage.importProcessingMessage') : t('settingsPage.importDataButton')} ({t('settingsPage.exportFormatJson', {defaultValue: "JSON"})})
            </Button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" aria-hidden="true" />
      </section>

      <Modal
        isOpen={isImportConfirmModalOpen}
        onClose={() => { setIsImportConfirmModalOpen(false); setFileToImport(null); }}
        title={t('settingsPage.importConfirmTitle')}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t('settingsPage.importConfirmMessageFull')}</p>
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => { setIsImportConfirmModalOpen(false); setFileToImport(null); }}>
            {t('settingsPage.importCancelButton')}
          </Button>
          <Button variant="danger" onClick={handleImportDataConfirmed}>
            {t('settingsPage.importConfirmButton')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
