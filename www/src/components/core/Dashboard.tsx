
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionType, PieChartData, Budget, BudgetWithDetails } from '../../types';
import { 
  getTransactions
} from '../../services/transactionService';
import {
  getBudgetsForMonthWithRollover, // Updated service function
  getAllBudgets, // To get all budgets for rollover calculation
  addBudget as apiAddBudget,
  updateBudget as apiUpdateBudget,
  deleteBudget as apiDeleteBudget,
} from '../../services/budgetService';
// TransactionForm is no longer used here
import SummaryDisplay from '../visualizations/SummaryDisplay';
import CategoryPieChart from '../visualizations/CategoryPieChart';
import IncomeExpenseTrendChart from '../visualizations/IncomeExpenseTrendChart'; // New Chart
import AiFinancialTip from '../ai/AiFinancialTip';
import BudgetList from '../budgets/BudgetList';
import BudgetForm from '../budgets/BudgetForm';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
// Input is still used by budget modal
import Input from '../ui/Input'; 
import { useAppContext } from '../../contexts/AppContext';
import { DEFAULT_EXPENSE_CATEGORIES, LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES } from '../../constants';

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-plus ${className || "w-4 h-4"}`}></i>
);

const BanknotesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-piggy-bank ${className || "w-5 h-5"}`}></i>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-chevron-left ${className || "w-3 h-3"}`}></i>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-chevron-right ${className || "w-3 h-3"}`}></i>
);

interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
}

const Dashboard: React.FC = () => {
  const { t, language } = useAppContext();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const [currentMonthYear, setCurrentMonthYear] = useState<string>(new Date().toISOString().slice(0, 7));
  const [allUserBudgets, setAllUserBudgets] = useState<Budget[]>([]); // Store all budgets
  const [budgetsForDisplay, setBudgetsForDisplay] = useState<BudgetWithDetails[]>([]); // Budgets with rollover details
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null); // Use Budget for form, details are calculated
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);

  const [allExpenseCategoriesForBudget, setAllExpenseCategoriesForBudget] = useState<{original: string, translated: string}[]>([]);

  useEffect(() => {
    const customExpense = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES) || '[]');
    const combined = Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...customExpense]));
    const translated = combined.map(cat => {
        const key = `categories.${cat.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
        const translatedDisplay = t(key);
        return { original: cat, translated: translatedDisplay === key ? cat : translatedDisplay };
    }).sort((a,b) => a.translated.localeCompare(b.translated));
    setAllExpenseCategoriesForBudget(translated);
  }, [t]);

  const fetchAllData = useCallback(() => {
    setIsLoadingTransactions(true);
    setIsLoadingBudgets(true);

    const userTransactions = getTransactions();
    userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(userTransactions);
    setIsLoadingTransactions(false);

    const userBudgets = getAllBudgets(); // Fetch all budgets
    setAllUserBudgets(userBudgets);
    
    // Calculate budgets with rollover details for the current month
    const detailedBudgets = getBudgetsForMonthWithRollover(currentMonthYear, userTransactions, userBudgets);
    setBudgetsForDisplay(detailedBudgets);
    setIsLoadingBudgets(false);
  }, [currentMonthYear]); // userTransactions removed from dep array, it's fetched inside

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    // Re-calculate display budgets when month or underlying data changes
    if (allTransactions.length > 0 || allUserBudgets.length > 0 || !isLoadingTransactions) { // Ensure data is available
        setIsLoadingBudgets(true);
        const detailedBudgets = getBudgetsForMonthWithRollover(currentMonthYear, allTransactions, allUserBudgets);
        setBudgetsForDisplay(detailedBudgets);
        setIsLoadingBudgets(false);
    }
  }, [currentMonthYear, allTransactions, allUserBudgets, isLoadingTransactions]);


  const { income, expenses, balance } = useMemo(() => {
    let currentIncome = 0;
    let currentExpenses = 0;
    allTransactions.forEach(transaction => {
      if (transaction.type === TransactionType.INCOME) {
        currentIncome += transaction.amount;
      } else {
        currentExpenses += transaction.amount;
      }
    });
    return { income: currentIncome, expenses: currentExpenses, balance: currentIncome - currentExpenses };
  }, [allTransactions]);

  const expensePieChartData = useMemo((): PieChartData[] => {
    const expenseCategoriesMap: { [key: string]: number } = {};
    allTransactions
      .filter(transaction => transaction.type === TransactionType.EXPENSE)
      .forEach(transaction => {
        const categoryKey = `categories.${transaction.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
        const translatedCategory = t(categoryKey) === categoryKey ? transaction.category : t(categoryKey);
        expenseCategoriesMap[translatedCategory] = (expenseCategoriesMap[translatedCategory] || 0) + transaction.amount;
      });
    return Object.entries(expenseCategoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [allTransactions, t]);
  
  const incomeExpenseTrendData = useMemo((): MonthlyTrendData[] => {
    const data: MonthlyTrendData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) { // Last 6 months including current
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      const year = date.getFullYear();
      const monthPadded = (date.getMonth() + 1).toString().padStart(2, '0');
      const monthYearKey = `${year}-${monthPadded}`; // Use local year and month
      
      const monthDisplay = date.toLocaleDateString(language, { month: 'short', year: '2-digit' });

      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      allTransactions.forEach(tx => {
        if (tx.date.startsWith(monthYearKey)) { // Compare with "YYYY-MM" from local date
          if (tx.type === TransactionType.INCOME) {
            monthlyIncome += tx.amount;
          } else {
            monthlyExpenses += tx.amount;
          }
        }
      });
      data.push({ month: monthDisplay, income: monthlyIncome, expenses: monthlyExpenses });
    }
    return data;
  }, [allTransactions, language]);


  const handleMonthChange = (offset: number) => {
    setCurrentMonthYear(prevMonthYear => {
      const date = new Date(prevMonthYear + '-01');
      date.setMonth(date.getMonth() + offset);
      return date.toISOString().slice(0, 7);
    });
  };

  const handleAddOrUpdateBudget = useCallback((budgetData: Omit<Budget, 'id' | 'userId'>) => {
    if (editingBudget) {
      apiUpdateBudget({ ...editingBudget, ...budgetData });
    } else {
      apiAddBudget(budgetData);
    }
    fetchAllData(); 
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  }, [editingBudget, fetchAllData]);

  const handleDeleteBudget = useCallback((budgetId: string) => {
    if (window.confirm(t('dashboard.budgets.confirmDeleteBudget'))) {
      apiDeleteBudget(budgetId);
      fetchAllData(); 
    }
  }, [fetchAllData, t]);

  const openBudgetModal = useCallback((budgetToEdit?: Budget) => { // Use Budget for form
    setEditingBudget(budgetToEdit || null);
    setIsBudgetModalOpen(true);
  }, []);

  const currentMonthDisplay = useMemo(() => {
    const date = new Date(currentMonthYear + '-01');
    return date.toLocaleDateString(language, { year: 'numeric', month: 'long' });
  }, [currentMonthYear, language]);


  if (isLoadingTransactions) { // Only initial transaction load shows full page spinner
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Spinner size="lg" color="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <SummaryDisplay income={income} expenses={expenses} balance={balance} />
      
      <div className="fintrack-card">
        <h2 className="fintrack-section-title">{t('dashboard.charts.incomeExpenseTrendTitle')}</h2>
        <IncomeExpenseTrendChart data={incomeExpenseTrendData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 fintrack-card">
            <h2 className="fintrack-section-title">{t('dashboard.expenseBreakdownTitle')}</h2>
            <CategoryPieChart data={expensePieChartData} />
        </div>
        <div className="fintrack-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
              <h2 className="fintrack-section-title flex items-center mb-2 sm:mb-4">
                  <BanknotesIcon className="w-5 h-5 mr-2.5 text-primary dark:text-primaryLight"/>
                  {t('dashboard.budgets.title')}
              </h2>
              <Button onClick={() => openBudgetModal()} variant="primary" size="sm" leftIcon={<PlusIcon />}>
                  {t('dashboard.budgets.addBudgetButton')}
              </Button>
          </div>
          <div className="flex items-center justify-between mb-3 text-sm">
              <Button 
                onClick={() => handleMonthChange(-1)} 
                variant="ghost" 
                size="sm" 
                aria-label={t('dashboard.budgets.previousMonthAriaLabel')}
                className="text-grayText hover:text-primary dark:hover:text-primaryLight p-1.5"
              >
                <ChevronLeftIcon />
              </Button>
              <span className="font-medium text-lighttext dark:text-darktext">{currentMonthDisplay}</span>
              <Button 
                onClick={() => handleMonthChange(1)} 
                variant="ghost" 
                size="sm" 
                aria-label={t('dashboard.budgets.nextMonthAriaLabel')}
                className="text-grayText hover:text-primary dark:hover:text-primaryLight p-1.5"
              >
                <ChevronRightIcon />
              </Button>
          </div>
          {isLoadingBudgets ? <div className="flex justify-center py-4"><Spinner color="text-primary"/></div> : <BudgetList budgets={budgetsForDisplay} onEdit={openBudgetModal} onDelete={handleDeleteBudget} />}
        </div>
      </div>
      
      <section aria-labelledby="ai-tip-heading" className="fintrack-card">
        <AiFinancialTip balance={balance} recentTransactionsCount={allTransactions.length} />
      </section>

      <Modal 
        isOpen={isBudgetModalOpen} 
        onClose={() => { setIsBudgetModalOpen(false); setEditingBudget(null); }} 
        title={editingBudget ? t('dashboard.budgets.editBudgetModalTitle') : t('dashboard.budgets.addBudgetModalTitle')}
      >
        <BudgetForm
          onSubmit={handleAddOrUpdateBudget}
          initialData={editingBudget || undefined}
          existingBudgetsForMonth={allUserBudgets.filter(b => b.monthYear === (editingBudget?.monthYear || currentMonthYear) && b.id !== editingBudget?.id )}
          availableCategories={allExpenseCategoriesForBudget}
          currentMonthYear={editingBudget?.monthYear || currentMonthYear}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
