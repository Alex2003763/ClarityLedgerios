
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getTransactions } from '../../services/transactionService';
import { Transaction, TransactionType } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SpendingByCategoryChart from '../visualizations/SpendingByCategoryChart';
import TopExpenseCategoriesChart from '../visualizations/TopExpenseCategoriesChart';
import CashFlowSummary from '../visualizations/CashFlowSummary'; // New
import CategoryFlowTable from '../visualizations/CategoryFlowTable'; // New

interface MonthlyCategorySpending {
  month: string; // Display string, e.g., "Jan '23"
  [category: string]: number | string; // categoryName: amount
}

interface TopCategoryData {
  name: string;
  value: number;
}

interface CategoryFlowItem {
  name: string;
  value: number;
}

interface CashFlowData {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  incomeDetails: CategoryFlowItem[];
  expenseDetails: CategoryFlowItem[];
}

type ReportTab = 'trend' | 'topCategories' | 'cashFlow';

const getDefaultDateRange = (): { start: string, end: string } => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start: firstDayOfMonth, end: lastDayOfMonth };
};

const ReportsPage: React.FC = () => {
  const { t, language, formatCurrency } = useAppContext();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const defaultRange = getDefaultDateRange();
  const [filterStartDate, setFilterStartDate] = useState<string>(defaultRange.start);
  const [filterEndDate, setFilterEndDate] = useState<string>(defaultRange.end);
  const [activeReportRange, setActiveReportRange] = useState<{start: string, end: string}>(defaultRange);
  const [activeTab, setActiveTab] = useState<ReportTab>('trend');

  useEffect(() => {
    setIsLoading(true);
    const transactions = getTransactions();
    setAllTransactions(transactions);
    setIsLoading(false);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setActiveReportRange({ start: filterStartDate, end: filterEndDate });
  }, [filterStartDate, filterEndDate]);


  const filteredTransactionsForReports = useMemo(() => {
    return allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        const startDate = new Date(activeReportRange.start);
        const endDate = new Date(activeReportRange.end);
        endDate.setHours(23, 59, 59, 999); 
        return txDate >= startDate && txDate <= endDate;
    });
  }, [allTransactions, activeReportRange]);

  const { spendingByCategoryChartData, spendingCategories } = useMemo(() => {
    const expenseTransactions = filteredTransactionsForReports.filter(tx => tx.type === TransactionType.EXPENSE);
    if (expenseTransactions.length === 0) {
      return { spendingByCategoryChartData: [], spendingCategories: [] };
    }

    const monthlyDataMap: { 
      [monthYearSortable: string]: { 
        display: string; 
        spends: { [category: string]: number };
      } 
    } = {};
    const uniqueCategories = new Set<string>();
    
    const startDate = new Date(activeReportRange.start);
    const endDate = new Date(activeReportRange.end);
    
    let currentLoopDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while(currentLoopDate <= endDate) {
        const year = currentLoopDate.getFullYear();
        const month = (currentLoopDate.getMonth() + 1).toString().padStart(2, '0');
        const monthYearSortableKey = `${year}-${month}`;
        
        const monthDisplay = currentLoopDate.toLocaleDateString(language, { month: 'short', year: '2-digit' });
        if (!monthlyDataMap[monthYearSortableKey]) {
             monthlyDataMap[monthYearSortableKey] = { display: monthDisplay, spends: {} };
        }
        currentLoopDate.setMonth(currentLoopDate.getMonth() + 1);
    }


    expenseTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const year = txDate.getFullYear();
      const month = (txDate.getMonth() + 1).toString().padStart(2, '0');
      const monthYearSortableKey = `${year}-${month}`;
      
      if (monthlyDataMap[monthYearSortableKey]) { 
          const categoryKey = `categories.${tx.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
          const translatedCategory = t(categoryKey) === categoryKey ? tx.category : t(categoryKey);
          
          monthlyDataMap[monthYearSortableKey].spends[translatedCategory] = 
            (monthlyDataMap[monthYearSortableKey].spends[translatedCategory] || 0) + tx.amount;
          uniqueCategories.add(translatedCategory);
      }
    });
    
    const sortedCategories = Array.from(uniqueCategories).sort((a,b) => a.localeCompare(b));

    const finalChartData: MonthlyCategorySpending[] = Object.entries(monthlyDataMap)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) 
      .map(([_, value]) => {
        const monthEntry: MonthlyCategorySpending = { month: value.display }; 
        sortedCategories.forEach(cat => {
          monthEntry[cat] = value.spends[cat] || 0;
        });
        return monthEntry;
      });

    return { spendingByCategoryChartData: finalChartData, spendingCategories: sortedCategories };
  }, [filteredTransactionsForReports, t, language, activeReportRange]);

  const topExpenseCategoriesData = useMemo((): TopCategoryData[] => {
    const expenseTransactions = filteredTransactionsForReports.filter(tx => tx.type === TransactionType.EXPENSE);
    if (expenseTransactions.length === 0) return [];

    const categoryTotals: { [key: string]: number } = {};
    expenseTransactions.forEach(tx => {
      const categoryKey = `categories.${tx.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
      const translatedCategory = t(categoryKey) === categoryKey ? tx.category : t(categoryKey);
      categoryTotals[translatedCategory] = (categoryTotals[translatedCategory] || 0) + tx.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); 
  }, [filteredTransactionsForReports, t]);

  const cashFlowReportData = useMemo((): CashFlowData => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeCategoryMap: { [key: string]: number } = {};
    const expenseCategoryMap: { [key: string]: number } = {};

    filteredTransactionsForReports.forEach(tx => {
      const categoryKey = `categories.${tx.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
      const translatedCategory = t(categoryKey) === categoryKey ? tx.category : t(categoryKey);

      if (tx.type === TransactionType.INCOME) {
        totalIncome += tx.amount;
        incomeCategoryMap[translatedCategory] = (incomeCategoryMap[translatedCategory] || 0) + tx.amount;
      } else {
        totalExpenses += tx.amount;
        expenseCategoryMap[translatedCategory] = (expenseCategoryMap[translatedCategory] || 0) + tx.amount;
      }
    });

    const incomeDetails = Object.entries(incomeCategoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const expenseDetails = Object.entries(expenseCategoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    return {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        incomeDetails,
        expenseDetails
    };
  }, [filteredTransactionsForReports, t]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Spinner size="lg" color="text-primary" />
      </div>
    );
  }

  const renderTabButton = (tabId: ReportTab, labelKey: string, defaultLabel: string) => (
    <button
      role="tab"
      aria-selected={activeTab === tabId}
      aria-controls={`${tabId}-panel`}
      id={`${tabId}-tab`}
      onClick={() => setActiveTab(tabId)}
      className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primaryLight/50 rounded-t-md
        ${activeTab === tabId
          ? 'border-primary text-primary dark:border-primaryLight dark:text-primaryLight bg-primary/5 dark:bg-primaryLight/10'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
        }`}
    >
      {t(labelKey, { defaultValue: defaultLabel })}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <section className="fintrack-card">
        <h2 className="fintrack-section-title mb-4">{t('reportsPage.filters.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label={t('reportsPage.filters.startDateLabel')}
            id="report-startDate"
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            containerClassName="!mb-0"
            className="dark:[color-scheme:dark]"
          />
          <Input
            label={t('reportsPage.filters.endDateLabel')}
            id="report-endDate"
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            containerClassName="!mb-0"
            className="dark:[color-scheme:dark]"
          />
          <Button onClick={handleApplyFilters} variant="primary" className="h-11 md:mt-auto">
            {t('reportsPage.filters.applyButton')}
          </Button>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="mb-0">
        <div className="border-b border-gray-200 dark:border-darkBorder">
          <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label={t('reportsPage.tabs.ariaLabel', {defaultValue: "Report Tabs"})}>
            {renderTabButton('trend', 'reportsPage.tabs.spendingTrend', 'Spending Trend')}
            {renderTabButton('topCategories', 'reportsPage.tabs.topCategories', 'Top Categories')}
            {renderTabButton('cashFlow', 'reportsPage.tabs.cashFlow', 'Cash Flow')} 
          </nav>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-0"> 
        <div role="tabpanel" hidden={activeTab !== 'trend'} id="trend-panel" aria-labelledby="trend-tab">
          {activeTab === 'trend' && (
            <div className="fintrack-card mt-6 sm:mt-8"> 
              <h2 className="fintrack-section-title mb-6">{t('reportsPage.spendingByCategoryChart.title')}</h2>
              <SpendingByCategoryChart data={spendingByCategoryChartData} categories={spendingCategories} />
            </div>
          )}
        </div>
        <div role="tabpanel" hidden={activeTab !== 'topCategories'} id="topCategories-panel" aria-labelledby="topCategories-tab">
          {activeTab === 'topCategories' && (
            <div className="fintrack-card mt-6 sm:mt-8"> 
              <h2 className="fintrack-section-title mb-6">{t('reportsPage.topExpenseCategoriesChart.title')}</h2>
              <TopExpenseCategoriesChart data={topExpenseCategoriesData} />
            </div>
          )}
        </div>
        <div role="tabpanel" hidden={activeTab !== 'cashFlow'} id="cashFlow-panel" aria-labelledby="cashFlow-tab">
          {activeTab === 'cashFlow' && (
            <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
              <CashFlowSummary 
                totalIncome={cashFlowReportData.totalIncome}
                totalExpenses={cashFlowReportData.totalExpenses}
                netCashFlow={cashFlowReportData.netCashFlow}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <CategoryFlowTable
                    title={t('reportsPage.cashFlowReport.incomeSourcesTitle', {defaultValue: 'Income Sources'})}
                    data={cashFlowReportData.incomeDetails}
                    type="income"
                    formatCurrency={formatCurrency}
                    t={t}
                />
                <CategoryFlowTable
                    title={t('reportsPage.cashFlowReport.expenseCategoriesTitle', {defaultValue: 'Expense Categories'})}
                    data={cashFlowReportData.expenseDetails}
                    type="expense"
                    formatCurrency={formatCurrency}
                    t={t}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
