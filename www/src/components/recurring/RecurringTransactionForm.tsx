
import React, { useState, useMemo, useEffect } from 'react';
import { RecurringTransaction, TransactionType, RecurringFrequency } from '../../types';
import { 
  DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_INCOME_CATEGORIES,
  LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES,
  LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES
} from '../../constants';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAppContext } from '../../contexts/AppContext';

interface RecurringTransactionFormProps {
  onSubmit: (data: Omit<RecurringTransaction, 'id' | 'userId' | 'nextDueDate' | 'lastGeneratedDate' | 'isActive'> | RecurringTransaction) => void;
  initialData?: RecurringTransaction;
}

interface CategoryOption {
  original: string;
  translated: string;
}

const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({ onSubmit, initialData }) => {
  const { t } = useAppContext();

  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  const [frequency, setFrequency] = useState<RecurringFrequency>(initialData?.frequency || RecurringFrequency.MONTHLY);
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [tags, setTags] = useState<string>(initialData?.tags?.join(', ') || '');
  const [isActive, setIsActive] = useState<boolean>(initialData ? initialData.isActive : true); // Default to true for new, or current for existing
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [allExpenseCategories, setAllExpenseCategories] = useState<CategoryOption[]>([]);
  const [allIncomeCategories, setAllIncomeCategories] = useState<CategoryOption[]>([]);
  
  const getTranslatedCategories = (defaultCategories: string[], customCategoriesData: string[]): CategoryOption[] => {
    const combined = Array.from(new Set([...defaultCategories, ...customCategoriesData]));
    return combined.map(cat => {
        const key = `categories.${cat.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
        const translated = t(key);
        return { original: cat, translated: translated === key ? cat : translated };
    }).sort((a,b) => a.translated.localeCompare(b.translated));
  };

  useEffect(() => {
    const customExpenseData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES) || '[]');
    setAllExpenseCategories(getTranslatedCategories(DEFAULT_EXPENSE_CATEGORIES, customExpenseData));
    
    const customIncomeData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES) || '[]');
    setAllIncomeCategories(getTranslatedCategories(DEFAULT_INCOME_CATEGORIES, customIncomeData));
  }, [t]);

  const availableCategories = useMemo(() => {
    return type === TransactionType.EXPENSE ? allExpenseCategories : allIncomeCategories;
  }, [type, allExpenseCategories, allIncomeCategories]);
  
  const [category, setCategory] = useState(initialData?.category || (availableCategories[0]?.original || ''));

  useEffect(() => {
    // Ensure category is updated if type changes or initialData is set
    if (initialData && initialData.category) {
        setCategory(initialData.category);
    } else if (!initialData) { // For new forms, set to first available category of the current type
        setCategory(availableCategories[0]?.original || '');
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
    if (!startDate) newErrors.startDate = t('recurringTransactionsPage.form.errors.startDateRequired', {defaultValue: "Start date is required."});
    if (endDate && endDate < startDate) newErrors.endDate = t('recurringTransactionsPage.form.errors.endDateInvalid', {defaultValue: "End date cannot be before start date."});
    if (!category) newErrors.category = t('transactionForm.errors.categoryRequired');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const commonData = {
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      category,
      frequency,
      startDate,
      endDate: endDate || null, // Ensure null if empty string
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    };

    if (initialData) { // Editing existing
        onSubmit({
            ...initialData,
            ...commonData,
            isActive: isActive, // Ensure isActive is passed for updates
        });
    } else { // Adding new
        onSubmit(commonData); // isActive will be set to true by default in service
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4"> {/* Reduced space-y */}
      <Input
        label={t('transactionForm.descriptionLabel')}
        id="recurring-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        placeholder={t('transactionForm.descriptionPlaceholder')}
        containerClassName="!mb-0" // Override Input's internal margin
      />
      <Input
        label={t('transactionForm.amountLabel')}
        id="recurring-amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.amount}
        placeholder={t('transactionForm.amountPlaceholder')}
        min="0.01"
        step="0.01"
        containerClassName="!mb-0" // Override Input's internal margin
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transactionForm.typeLabel')}</label>
        <div className="flex space-x-3">
          <Button
            type="button"
            onClick={() => setType(TransactionType.EXPENSE)}
            className={`w-full ${type === TransactionType.EXPENSE ? 'bg-danger text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
          >
            {t('transactionForm.expenseButton')}
          </Button>
          <Button
            type="button"
            onClick={() => setType(TransactionType.INCOME)}
            className={`w-full ${type === TransactionType.INCOME ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
          >
            {t('transactionForm.incomeButton')}
          </Button>
        </div>
      </div>
       <div>
        <label htmlFor="recurring-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transactionForm.categoryLabel')}</label>
        <select
          id="recurring-category"
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
      <div>
        <label htmlFor="recurring-frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recurringTransactionsPage.form.frequencyLabel', {defaultValue: "Frequency"})}</label>
        <select
          id="recurring-frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
          className={`mt-1 block w-full px-3 py-2 border ${errors.frequency ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-darkBorder'} 
                      rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary 
                      sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext`}
        >
          {Object.values(RecurringFrequency).map(freq => (
            <option key={freq} value={freq}>{t(`recurringTransactionsPage.frequencies.${freq}`, {defaultValue: freq.charAt(0).toUpperCase() + freq.slice(1)})}</option>
          ))}
        </select>
      </div>
      <Input
        label={t('recurringTransactionsPage.form.startDateLabel', {defaultValue: "Start Date"})}
        id="recurring-startDate"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        error={errors.startDate}
        className="dark:[color-scheme:dark]"
        containerClassName="!mb-0" // Override Input's internal margin
      />
      <Input
        label={t('recurringTransactionsPage.form.endDateLabel', {defaultValue: "End Date (Optional)"})}
        id="recurring-endDate"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        error={errors.endDate}
        className="dark:[color-scheme:dark]"
        containerClassName="!mb-0" // Override Input's internal margin
      />
      <Input
        label={t('transactionForm.tagsLabel')}
        id="recurring-tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder={t('transactionForm.tagsPlaceholder')}
        containerClassName="!mb-0" // Override Input's internal margin
      />
       {initialData && (
        <div className="flex items-center pt-1"> {/* Added pt-1 for slight separation if needed */}
            <input
            id="recurring-isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-primary border-gray-300 dark:border-darkBorder rounded focus:ring-primary dark:bg-darkSurface dark:checked:bg-primary"
            />
            <label htmlFor="recurring-isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            {t('recurringTransactionsPage.form.isActiveLabel', {defaultValue: "Active (auto-generate transactions)"})}
            </label>
        </div>
      )}
      <div className="pt-2"> {/* Added pt-2 for button separation */}
        <Button type="submit" variant="primary" className="w-full">
            {initialData ? t('transactionForm.submitUpdateButton') : t('transactionForm.submitAddButton')}
        </Button>
      </div>
    </form>
  );
};

export default RecurringTransactionForm;