import React, { useState, useEffect, useMemo } from 'react';
import { Budget } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAppContext } from '../../contexts/AppContext';

interface BudgetFormProps {
  onSubmit: (budget: Omit<Budget, 'id' | 'userId'>) => void;
  initialData?: Budget;
  existingBudgetsForMonth: Budget[];
  availableCategories: { original: string; translated: string }[];
  currentMonthYear: string; // YYYY-MM
}

const BudgetForm: React.FC<BudgetFormProps> = ({ 
    onSubmit, 
    initialData, 
    existingBudgetsForMonth, 
    availableCategories,
    currentMonthYear
}) => {
  const { t } = useAppContext();

  const [category, setCategory] = useState(initialData?.category || '');
  const [targetAmount, setTargetAmount] = useState<string>(initialData?.targetAmount?.toString() || '');
  const [monthYear, setMonthYear] = useState(initialData?.monthYear || currentMonthYear);
  const [allowRollover, setAllowRollover] = useState<boolean>(initialData?.allowRollover || false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setTargetAmount(initialData.targetAmount.toString());
      setMonthYear(initialData.monthYear);
      setAllowRollover(initialData.allowRollover || false);
    } else {
      // Reset for new budget, default to current month year from props
      setMonthYear(currentMonthYear);
      setCategory(''); // User must select
      setTargetAmount('');
      setAllowRollover(false);
    }
  }, [initialData, currentMonthYear]);

  const filteredAvailableCategories = useMemo(() => {
    if (initialData) { // If editing, allow the current category
        return availableCategories;
    }
    // For new budgets, only show categories not already budgeted for the selected monthYear
    return availableCategories.filter(catOpt => 
        !existingBudgetsForMonth.some(b => b.category === catOpt.original && b.monthYear === monthYear)
    );
  }, [availableCategories, existingBudgetsForMonth, monthYear, initialData]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!category) newErrors.category = t('budgetForm.errors.categoryRequired');
    if (!targetAmount.trim()) {
      newErrors.targetAmount = t('budgetForm.errors.amountRequired');
    } else if (isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      newErrors.targetAmount = t('budgetForm.errors.amountPositive');
    }
    if (!monthYear.match(/^\d{4}-\d{2}$/)) { // Basic YYYY-MM validation
        newErrors.monthYear = t('budgetForm.errors.monthYearInvalid');
    } else {
        const [year, month] = monthYear.split('-').map(Number);
        if (month < 1 || month > 12 || year < 2000 || year > 2100) {
            newErrors.monthYear = t('budgetForm.errors.monthYearInvalid');
        }
    }

    // Check if category is already budgeted for this month (if not editing this specific budget)
    if (!initialData || (initialData && initialData.category !== category)) {
        if (existingBudgetsForMonth.some(b => b.category === category && b.monthYear === monthYear)) {
            newErrors.category = t('budgetForm.errors.categoryBudgeted', { category });
        }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      category,
      targetAmount: parseFloat(targetAmount),
      monthYear,
      allowRollover,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="budget-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('budgetForm.categoryLabel')}
        </label>
        <select
          id="budget-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border ${errors.category ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-darkBorder'} 
                      rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary 
                      sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext`}
          disabled={!!initialData} // Disable category change when editing
        >
          <option value="">{t('budgetForm.selectCategoryPlaceholder')}</option>
          {filteredAvailableCategories.map(catObj => (
            <option key={catObj.original} value={catObj.original}>{catObj.translated}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.category}</p>}
      </div>

      <Input
        label={t('budgetForm.targetAmountLabel')}
        id="budget-targetAmount"
        type="number"
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
        error={errors.targetAmount}
        placeholder="0.00"
        min="0.01"
        step="0.01"
      />
      
      <Input
        label={t('budgetForm.monthYearLabel')}
        id="budget-monthYear"
        type="text" // Could be replaced with a month picker component
        value={monthYear}
        onChange={(e) => setMonthYear(e.target.value)}
        error={errors.monthYear}
        placeholder="YYYY-MM"
        maxLength={7}
        disabled={!!initialData} // Disable monthYear change when editing
      />
      {initialData && <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3">{t('budgetForm.editInfo')}</p>}

      <div className="flex items-center">
        <input
          id="budget-allowRollover"
          type="checkbox"
          checked={allowRollover}
          onChange={(e) => setAllowRollover(e.target.checked)}
          className="h-4 w-4 text-primary border-gray-300 dark:border-darkBorder rounded focus:ring-primary dark:bg-darkSurface dark:checked:bg-primary"
        />
        <label htmlFor="budget-allowRollover" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
          {t('budgetForm.allowRolloverLabel', {defaultValue: "Allow rollover for this category"})}
        </label>
      </div>

      <Button type="submit" variant="primary" className="w-full">
        {initialData ? t('budgetForm.submitUpdateButton') : t('budgetForm.submitAddButton')}
      </Button>
    </form>
  );
};

export default BudgetForm;