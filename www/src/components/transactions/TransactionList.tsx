
import React from 'react';
import { Transaction, TransactionType } from '../../types';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-trash-alt ${className || "w-4 h-4"}`}></i>
);

const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-tag ${className || "w-3 h-3"}`}></i>
);

// Category specific icons (examples)
const categoryIcons: { [key: string]: string } = {
  Food: 'fas fa-utensils',
  Groceries: 'fas fa-shopping-cart',
  Transport: 'fas fa-car',
  Utilities: 'fas fa-bolt',
  Housing: 'fas fa-home',
  Entertainment: 'fas fa-film',
  Health: 'fas fa-heartbeat',
  Shopping: 'fas fa-tshirt',
  Education: 'fas fa-graduation-cap',
  Travel: 'fas fa-plane',
  Salary: 'fas fa-money-check-alt',
  Bonus: 'fas fa-gift',
  Investment: 'fas fa-chart-line',
  Gift: 'fas fa-gift',
  Other: 'fas fa-receipt'
};


interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

const TransactionItemRow: React.FC<TransactionItemProps> = ({ transaction, onDelete }) => {
  const { t, language, formatCurrency } = useAppContext();
  const isIncome = transaction.type === TransactionType.INCOME;
  
  const amountClass = isIncome ? 'text-success dark:text-green-400 font-semibold' : 'text-danger dark:text-red-400 font-semibold';
  const sign = isIncome ? '+' : '-';
  
  const categoryKey = `categories.${transaction.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
  const translatedCategory = t(categoryKey) === categoryKey ? transaction.category : t(categoryKey);

  const iconClass = categoryIcons[transaction.category] || categoryIcons['Other'];
  const iconBgColor = isIncome ? 'bg-green-100 dark:bg-green-900/[0.3]' : 'bg-red-100 dark:bg-red-900/[0.3]';
  const iconColor = isIncome ? 'text-success dark:text-green-400' : 'text-danger dark:text-red-400';


  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-darkSurface/50 transition-colors duration-150 group">
      <td className="px-3 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`mr-3 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}>
            <i className={`${iconClass} ${iconColor} text-lg`}></i>
          </div>
          <div>
            <div className="text-sm font-medium text-lighttext dark:text-darktext">{translatedCategory}</div>
            {transaction.tags && transaction.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                {transaction.tags.slice(0,2).map(tag => ( // Show max 2 tags inline for table
                    <span key={tag} className="px-2 py-0.5 text-xs bg-accent/10 text-accent dark:bg-accent/20 dark:text-blue-300 rounded-full flex items-center">
                    <TagIcon className="w-2.5 h-2.5 mr-1 opacity-80" />
                    {tag}
                    </span>
                ))}
                </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap">
        <div className="text-sm text-lighttext dark:text-darktext truncate max-w-xs" title={transaction.description}>{transaction.description}</div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-grayText dark:text-gray-400">
        {new Date(transaction.date).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' })}
      </td>
      <td className={`px-3 py-4 whitespace-nowrap text-sm ${amountClass}`}>
        {sign}{formatCurrency(transaction.amount)}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Button 
          onClick={() => onDelete(transaction.id)} 
          variant="ghost" 
          size="sm" 
          className="text-grayText hover:text-danger dark:hover:text-red-400 p-1.5 opacity-50 group-hover:opacity-100 transition-opacity"
          aria-label={t('dashboard.confirmDeleteTransaction')}
        >
           <TrashIcon />
        </Button>
      </td>
    </tr>
  );
};


interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  isFiltered: boolean; 
  hasOriginalTransactions: boolean; 
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, isFiltered, hasOriginalTransactions }) => {
  const { t } = useAppContext();

  if (transactions.length === 0) {
    let message = t('transactionList.noTransactions');
    if (isFiltered && hasOriginalTransactions) {
      message = t('transactionList.noFilteredTransactions');
    } else if (!hasOriginalTransactions) {
      message = t('transactionList.noTransactions');
    }
    return <p className="text-center text-grayText dark:text-gray-400 py-12 text-base">{message}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-darkBorder">
        <thead className="bg-slate-50 dark:bg-darkSurface">
          <tr>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('transactionTable.category', { defaultValue: 'Category'})}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('transactionTable.description', { defaultValue: 'Description'})}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('transactionTable.date', { defaultValue: 'Date'})}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
              {t('transactionTable.amount', { defaultValue: 'Amount'})}
            </th>
            <th scope="col" className="relative px-3 py-3.5">
              <span className="sr-only">{t('transactionTable.actions', { defaultValue: 'Actions'})}</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-contentBg dark:bg-darkContentBg divide-y divide-gray-100 dark:divide-slate-700">
          {transactions.map(transaction => (
            <TransactionItemRow key={transaction.id} transaction={transaction} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;