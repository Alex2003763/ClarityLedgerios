import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType } from '../../types';
import { 
  DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_INCOME_CATEGORIES,
  LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES,
  LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES
} from '../../constants';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAppContext } from '../../contexts/AppContext';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  initialData?: Partial<Omit<Transaction, 'id' | 'userId'>>;
}

interface CategoryOption {
  original: string;
  translated: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, initialData }) => {
  const { t } = useAppContext();

  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  const [tags, setTags] = useState<string>(initialData?.tags?.join(', ') || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [allExpenseCategories, setAllExpenseCategories] = useState<CategoryOption[]>([]);
  const [allIncomeCategories, setAllIncomeCategories] = useState<CategoryOption[]>([]);
  
  const getTranslatedCategories = (defaultCategories: string[], customCategories: string[]): CategoryOption[] => {
    const combined = Array.from(new Set([...defaultCategories, ...customCategories])); // Unique categories
    return combined.map(cat => {
        const key = `categories.${cat.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`; // Sanitize for key
        const translated = t(key);
        return { original: cat, translated: translated === key ? cat : translated };
    }).sort((a,b) => a.translated.localeCompare(b.translated));
  };

  useEffect(() => {
    const customExpense = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES) || '[]');
    setAllExpenseCategories(getTranslatedCategories(DEFAULT_EXPENSE_CATEGORIES, customExpense));
    
    const customIncome = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES) || '[]');
    setAllIncomeCategories(getTranslatedCategories(DEFAULT_INCOME_CATEGORIES, customIncome));
  }, [t]);

  const availableCategories = useMemo(() => {
    return type === TransactionType.EXPENSE ? allExpenseCategories : allIncomeCategories;
  }, [type, allExpenseCategories, allIncomeCategories]);

  const getDefaultCategoryForType = (currentType: TransactionType, currentCategories: CategoryOption[]) => {
    return currentCategories[0]?.original || '';
  };
  
  const [category, setCategory] = useState(initialData?.category || getDefaultCategoryForType(type, availableCategories) || '');

  useEffect(() => {
    if (!initialData) {
      setCategory(getDefaultCategoryForType(type, availableCategories) || '');
    }
  }, [type, availableCategories, initialData]);


  const validate = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    if (!description.trim()) newErrors.description = t('transactionForm.errors.descriptionRequired');
    if (!amount.trim()) {
        newErrors.amount = t('transactionForm.errors.amountRequired');
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        newErrors.amount = t('transactionForm.errors.amountPositive');
    }
    if (!date) newErrors.date = t('transactionForm.errors.dateRequired');
    if (!category) newErrors.category = t('transactionForm.errors.categoryRequired');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const transactionData: Omit<Transaction, 'id' | 'userId'> = {
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      category,
      date,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    };

    onSubmit(transactionData);

    if (!initialData) { // Reset form only if it's not an update
        setDescription('');
        setAmount('');
        setTags('');
        const defaultNewType = TransactionType.EXPENSE;
        setType(defaultNewType);
        // Category reset will be handled by useEffect on type change
        setDate(new Date().toISOString().split('T')[0]);
        setErrors({});
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    // Category will be set by useEffect watching 'type' and 'availableCategories'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t('transactionForm.descriptionLabel')}
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        placeholder={t('transactionForm.descriptionPlaceholder')}
      />
      <Input
        label={t('transactionForm.amountLabel')}
        id="amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.amount}
        placeholder={t('transactionForm.amountPlaceholder')}
        min="0.01"
        step="0.01"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transactionForm.typeLabel')}</label>
        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            className={`w-full ${type === TransactionType.EXPENSE ? 'bg-danger text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
          >
            {t('transactionForm.expenseButton')}
          </Button>
          <Button
            type="button"
            onClick={() => handleTypeChange(TransactionType.INCOME)}
            className={`w-full ${type === TransactionType.INCOME ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
          >
            {t('transactionForm.incomeButton')}
          </Button>
        </div>
      </div>
       <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transactionForm.categoryLabel')}</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border ${errors.category ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-darkBorder'} 
                      rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary 
                      sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext`}
        >
          <option value="">{t('transactionForm.selectCategoryPlaceholder')}</option>
          {availableCategories.map(catObj => (
            <option key={catObj.original} value={catObj.original}>{catObj.translated}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.category}</p>}
      </div>
      <Input
        label={t('transactionForm.tagsLabel')}
        id="tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder={t('transactionForm.tagsPlaceholder')}
      />
      <Input
        label={t('transactionForm.dateLabel')}
        id="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={errors.date}
        className="dark:[color-scheme:dark]"
      />
      <Button type="submit" variant="primary" className="w-full">
        {initialData ? t('transactionForm.submitUpdateButton') : t('transactionForm.submitAddButton')}
      </Button>
    </form>
  );
};

export default TransactionForm;