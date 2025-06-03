
import React, { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import { Transaction, TransactionType } from '../../types';
import { getTransactions, deleteTransaction as apiDeleteTransaction, addTransaction as apiAddTransaction } from '../../services/transactionService';
import TransactionList from '../transactions/TransactionList';
import TransactionForm from '../transactions/TransactionForm';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { useAppContext } from '../../contexts/AppContext';

// Icons
const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-filter ${className || "w-4 h-4"}`}></i>
);
const ArrowPathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);
const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);
const TagIconSolid: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
      <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5V12a1.5 1.5 0 0 0 1.5 1.5h6.14l3.86 3.86a.75.75 0 0 0 1.06 0l3.86-3.86A1.5 1.5 0 0 0 19 12V3.5A1.5 1.5 0 0 0 17.5 2h-14ZM5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-plus ${className || "w-4 h-4"}`}></i>
);


const initialFilterInputs = {
  keyword: '',
  type: 'all',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  tags: '',
};

const TransactionsPage: React.FC = () => {
  const { t } = useAppContext();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [filterInputs, setFilterInputs] = useState(initialFilterInputs);
  const [activeFilters, setActiveFilters] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const fetchAllTransactions = useCallback(() => {
    setIsLoadingTransactions(true);
    const userTransactions = getTransactions();
    userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(userTransactions);
    setIsLoadingTransactions(false);
  }, []);

  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  const handleAddTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'userId'>) => {
    apiAddTransaction(transaction);
    fetchAllTransactions(); // Re-fetch to update the list
    setIsTransactionModalOpen(false);
  }, [fetchAllTransactions]);

  const handleDeleteTransaction = useCallback((id: string) => {
    if (window.confirm(t('dashboard.confirmDeleteTransaction'))) {
      apiDeleteTransaction(id);
      fetchAllTransactions(); 
    }
  }, [t, fetchAllTransactions]);

  const handleFilterInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const applyFilters = useCallback((transactionsToFilter: Transaction[], filters: typeof initialFilterInputs): Transaction[] => {
    return transactionsToFilter.filter(transaction => {
      let matches = true;
      if (filters.keyword) {
        const keywordLower = filters.keyword.toLowerCase();
        matches = matches && (transaction.description.toLowerCase().includes(keywordLower) || transaction.category.toLowerCase().includes(keywordLower));
      }
      if (filters.type !== 'all') {
        matches = matches && transaction.type === filters.type;
      }
      if (filters.startDate) {
        matches = matches && transaction.date >= filters.startDate;
      }
      if (filters.endDate) {
        matches = matches && transaction.date <= filters.endDate;
      }
      if (filters.minAmount) {
        matches = matches && transaction.amount >= parseFloat(filters.minAmount);
      }
      if (filters.maxAmount) {
        matches = matches && transaction.amount <= parseFloat(filters.maxAmount);
      }
      if (filters.tags) {
        const searchTags = filters.tags.toLowerCase().split(',').map(tag => tag.trim()).filter(Boolean);
        if (searchTags.length > 0) {
          matches = matches && (transaction.tags || []).some(tag => searchTags.includes(tag.toLowerCase()));
        }
      }
      return matches;
    });
  }, []);
  
  const filteredTransactions = useMemo(() => {
    if (!activeFilters) return allTransactions;
    return applyFilters(allTransactions, filterInputs);
  }, [allTransactions, filterInputs, activeFilters, applyFilters]);

  const handleApplyFilters = useCallback(() => {
    setActiveFilters(true);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterInputs(initialFilterInputs);
    setActiveFilters(false);
  }, []);

  const toggleFiltersVisibility = useCallback(() => {
    setIsFiltersVisible(prev => !prev);
  }, []);


  if (isLoadingTransactions) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Spinner size="lg" color="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="fintrack-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="fintrack-section-title !mb-2 sm:!mb-0">{t('navbar.transactions', {defaultValue: "All Transactions"})}</h2>
          <div className="flex space-x-2">
            <Button
                onClick={() => setIsTransactionModalOpen(true)}
                variant="primary"
                size="sm"
                leftIcon={<PlusIcon />}
              >
                {t('dashboard.addTransactionButton')}
              </Button>
            <Button
              onClick={toggleFiltersVisibility}
              variant="secondary"
              size="sm"
              leftIcon={<FilterIcon />}
              rightIcon={isFiltersVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
            >
              {isFiltersVisible ? t('dashboard.filters.hide') : t('dashboard.filters.show')}
            </Button>
          </div>
        </div>

        {isFiltersVisible && (
          <div className="border-t border-gray-200 dark:border-darkBorder pt-4 mt-4 mb-6 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                name="keyword"
                label={t('dashboard.filters.keywordLabel')}
                placeholder={t('dashboard.filters.keywordPlaceholder')}
                value={filterInputs.keyword}
                onChange={handleFilterInputChange}
                containerClassName="!mb-0"
              />
              <div>
                <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.filters.typeLabel')}</label>
                <select
                  id="filter-type"
                  name="type"
                  value={filterInputs.type}
                  onChange={handleFilterInputChange}
                  // Removed className="mt-1" to rely on global select styles
                >
                  <option value="all">{t('dashboard.filters.typeAll')}</option>
                  <option value={TransactionType.INCOME}>{t('dashboard.filters.typeIncome')}</option>
                  <option value={TransactionType.EXPENSE}>{t('dashboard.filters.typeExpense')}</option>
                </select>
              </div>
               <Input
                name="tags"
                label={t('dashboard.filters.tagLabel')}
                placeholder={t('dashboard.filters.tagPlaceholder')}
                value={filterInputs.tags}
                onChange={handleFilterInputChange}
                containerClassName="!mb-0"
                leftIcon={<TagIconSolid className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
              />
              <Input
                name="startDate"
                type="date"
                label={t('dashboard.filters.startDateLabel')}
                value={filterInputs.startDate}
                onChange={handleFilterInputChange}
                containerClassName="!mb-0"
                className="dark:[color-scheme:dark]"
              />
              <Input
                name="endDate"
                type="date"
                label={t('dashboard.filters.endDateLabel')}
                value={filterInputs.endDate}
                onChange={handleFilterInputChange}
                containerClassName="!mb-0"
                className="dark:[color-scheme:dark]"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="minAmount"
                  type="number"
                  label={t('dashboard.filters.minAmountLabel')}
                  placeholder="0.00"
                  value={filterInputs.minAmount}
                  onChange={handleFilterInputChange}
                  containerClassName="!mb-0"
                />
                <Input
                  name="maxAmount"
                  type="number"
                  label={t('dashboard.filters.maxAmountLabel')}
                  placeholder="1000.00"
                  value={filterInputs.maxAmount}
                  onChange={handleFilterInputChange}
                  containerClassName="!mb-0"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <Button onClick={handleApplyFilters} variant="primary" leftIcon={<FilterIcon />} className="w-full sm:w-auto">
                {t('dashboard.filters.applyButton')}
              </Button>
              <Button onClick={handleResetFilters} variant="ghost" leftIcon={<ArrowPathIcon />} className="w-full sm:w-auto">
                {t('dashboard.filters.resetButton')}
              </Button>
            </div>
          </div>
        )}
        <TransactionList 
          transactions={filteredTransactions} 
          onDelete={handleDeleteTransaction}
          isFiltered={activeFilters}
          hasOriginalTransactions={allTransactions.length > 0}
        />
      </div>
      <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={t('dashboard.addTransactionModalTitle')}>
        <TransactionForm onSubmit={handleAddTransaction} />
      </Modal>
    </div>
  );
};

export default TransactionsPage;
