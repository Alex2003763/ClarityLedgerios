import React from 'react';
import { RecurringTransaction, TransactionType } from '../../types';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-edit ${className || "w-4 h-4"}`}></i>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-trash-alt ${className || "w-4 h-4"}`}></i>
);
const ToggleOnIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-toggle-on ${className || "w-5 h-5"}`}></i>
);
const ToggleOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-toggle-off ${className || "w-5 h-5"}`}></i>
);

interface RecurringTransactionItemProps {
  transaction: RecurringTransaction;
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

const RecurringTransactionItemRow: React.FC<RecurringTransactionItemProps> = ({ transaction, onEdit, onDelete, onToggleActive }) => {
  const { t, language, formatCurrency } = useAppContext();
  const isIncome = transaction.type === TransactionType.INCOME;
  
  const amountClass = isIncome ? 'text-success dark:text-green-400 font-semibold' : 'text-danger dark:text-red-400 font-semibold';
  const sign = isIncome ? '+' : '-';
  
  const categoryKey = `categories.${transaction.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
  const translatedCategory = t(categoryKey) === categoryKey ? transaction.category : t(categoryKey);
  
  const frequencyKey = `recurringTransactionsPage.frequencies.${transaction.frequency}`;
  const translatedFrequency = t(frequencyKey, {defaultValue: transaction.frequency.charAt(0).toUpperCase() + transaction.frequency.slice(1)});

  return (
    <tr className={`hover:bg-slate-50 dark:hover:bg-darkSurface/50 transition-colors duration-150 group ${!transaction.isActive ? 'opacity-60 bg-gray-100 dark:bg-slate-800/50' : ''}`}>
      <td className="px-3 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-lighttext dark:text-darktext">{transaction.description}</div>
        <div className="text-xs text-grayText dark:text-gray-400">{translatedCategory}</div>
      </td>
      <td className={`px-3 py-4 whitespace-nowrap text-sm ${amountClass}`}>
        {sign}{formatCurrency(transaction.amount)}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-grayText dark:text-gray-400">
        {translatedFrequency}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-grayText dark:text-gray-400">
        {new Date(transaction.nextDueDate).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' })}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-grayText dark:text-gray-400">
        {transaction.endDate ? new Date(transaction.endDate).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' }) : t('recurringTransactionsPage.list.noEndDate', {defaultValue: 'N/A'})}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-grayText dark:text-gray-400">
        {transaction.lastGeneratedDate ? new Date(transaction.lastGeneratedDate).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' }) : t('recurringTransactionsPage.list.notGeneratedYet', {defaultValue: 'Never'})}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
        <Button 
          onClick={() => onToggleActive(transaction.id)} 
          variant="ghost" 
          size="sm" 
          className={`p-1.5 ${transaction.isActive ? 'text-success hover:text-green-600' : 'text-grayText hover:text-gray-600'}`}
          aria-label={transaction.isActive ? t('recurringTransactionsPage.list.deactivateAriaLabel', {defaultValue: 'Deactivate'}) : t('recurringTransactionsPage.list.activateAriaLabel', {defaultValue: 'Activate'})}
        >
           {transaction.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
        </Button>
        <Button 
          onClick={() => onEdit(transaction)} 
          variant="ghost" 
          size="sm" 
          className="text-grayText hover:text-primary dark:hover:text-primaryLight p-1.5 opacity-50 group-hover:opacity-100 transition-opacity"
          aria-label={t('recurringTransactionsPage.list.editAriaLabel', {defaultValue: 'Edit'})}
        >
           <EditIcon />
        </Button>
        <Button 
          onClick={() => onDelete(transaction.id)} 
          variant="ghost" 
          size="sm" 
          className="text-grayText hover:text-danger dark:hover:text-red-400 p-1.5 opacity-50 group-hover:opacity-100 transition-opacity"
          aria-label={t('recurringTransactionsPage.list.deleteAriaLabel', {defaultValue: 'Delete'})}
        >
           <TrashIcon />
        </Button>
      </td>
    </tr>
  );
};

interface RecurringTransactionListProps {
  transactions: RecurringTransaction[];
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

const RecurringTransactionList: React.FC<RecurringTransactionListProps> = ({ transactions, onEdit, onDelete, onToggleActive }) => {
  const { t } = useAppContext();

  if (transactions.length === 0) {
    return <p className="text-center text-grayText dark:text-gray-400 py-12 text-base">{t('recurringTransactionsPage.list.noTemplates', {defaultValue: "No recurring transaction templates found. Add one to get started!"})}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-darkBorder">
        <thead className="bg-slate-50 dark:bg-darkSurface">
          <tr>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('transactionTable.description')}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('transactionTable.amount')}
            </th>
             <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('recurringTransactionsPage.list.frequencyHeader', {defaultValue: 'Frequency'})}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('recurringTransactionsPage.list.nextDueDateHeader', {defaultValue: 'Next Due'})}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('recurringTransactionsPage.list.endDateHeader', {defaultValue: 'End Date'})}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('recurringTransactionsPage.list.lastGeneratedHeader', {defaultValue: 'Last Generated'})}
            </th>
            <th scope="col" className="relative px-3 py-3.5">
              <span className="sr-only">{t('transactionTable.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-contentBg dark:bg-darkContentBg divide-y divide-gray-100 dark:divide-slate-700">
          {transactions.map(transaction => (
            <RecurringTransactionItemRow 
                key={transaction.id} 
                transaction={transaction} 
                onEdit={onEdit} 
                onDelete={onDelete}
                onToggleActive={onToggleActive}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecurringTransactionList;