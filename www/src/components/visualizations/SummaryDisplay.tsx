
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface SummaryDisplayProps {
  income: number;
  expenses: number;
  balance: number;
}

const SummaryCard: React.FC<{ 
    title: string; 
    amount: number; 
    iconClass: string; 
    subtext?: string;
    formatCurrency: (amount: number) => string; 
    baseColorClass?: string; // e.g. 'text-primary', 'text-success', 'text-danger'
}> = ({ title, amount, iconClass, subtext, formatCurrency, baseColorClass = 'text-primary' }) => {
    const iconBgColor = baseColorClass.replace('text-', 'bg-') + (baseColorClass.includes('dark:') ? '/[0.15]' : '-100 dark:bg-opacity-15');


    return (
      <div className="fintrack-card border-b-4 border-primary dark:border-primaryLight hover:shadow-card-hover transition-shadow duration-300">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-grayText uppercase tracking-wide">{title}</p>
                <h2 className={`text-3xl lg:text-4xl font-bold mt-1 ${baseColorClass}`}>{formatCurrency(amount)}</h2>
                {subtext && <p className="text-xs text-grayText mt-1">{subtext}</p>}
            </div>
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${iconBgColor}`}>
                <i className={`${iconClass} ${baseColorClass} text-xl`}></i>
            </div>
        </div>
      </div>
    );
};


const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ income, expenses, balance }) => {
  const { t, formatCurrency } = useAppContext();
  
  // Example subtext, can be dynamic
  const incomeSubtext = t('summaryDisplay.incomeSubtext', { defaultValue: "+X% from last month"}); // Replace X% with actual data if available
  const expenseSubtext = t('summaryDisplay.expenseSubtext', { defaultValue: "-Y% from last month"}); // Replace Y% with actual data if available

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
      <SummaryCard 
        title={t('summaryDisplay.totalIncome')} 
        amount={income} 
        iconClass="fas fa-arrow-circle-up"
        subtext={incomeSubtext} 
        formatCurrency={formatCurrency}
        baseColorClass="text-success dark:text-green-400"
      />
      <SummaryCard 
        title={t('summaryDisplay.totalExpenses')} 
        amount={expenses} 
        iconClass="fas fa-arrow-circle-down"
        subtext={expenseSubtext}
        formatCurrency={formatCurrency}
        baseColorClass="text-danger dark:text-red-400"
      />
      <SummaryCard 
        title={t('summaryDisplay.currentBalance')} 
        amount={balance} 
        iconClass="fas fa-wallet"
        formatCurrency={formatCurrency}
        baseColorClass={balance >=0 ? "text-primary dark:text-primaryLight" : "text-danger dark:text-red-400"}
      />
    </div>
  );
};

export default SummaryDisplay;