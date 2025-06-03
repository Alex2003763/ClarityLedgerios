
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface CashFlowSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

const SummaryItemCard: React.FC<{ 
    title: string; 
    amount: number; 
    iconClass: string; 
    formatCurrency: (amount: number) => string; 
    baseColorClass?: string;
}> = ({ title, amount, iconClass, formatCurrency, baseColorClass = 'text-primary dark:text-primaryLight' }) => {
    const iconBgColor = baseColorClass.replace('text-', 'bg-') + (baseColorClass.includes('dark:') ? '/[0.15]' : '-100 dark:bg-opacity-15');

    return (
      <div className="fintrack-card border-l-4 dark:border-opacity-70 hover:shadow-card-hover transition-shadow duration-300" style={{ borderColor: baseColorClass.startsWith('text-') ? `var(--color-${baseColorClass.substring(5)})` : 'var(--color-primary)' }}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-grayText uppercase tracking-wide">{title}</p>
                <h2 className={`text-2xl lg:text-3xl font-bold mt-1 ${baseColorClass}`}>{formatCurrency(amount)}</h2>
            </div>
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}>
                <i className={`${iconClass} ${baseColorClass} text-lg`}></i>
            </div>
        </div>
      </div>
    );
};

const CashFlowSummary: React.FC<CashFlowSummaryProps> = ({ totalIncome, totalExpenses, netCashFlow }) => {
  const { t, formatCurrency } = useAppContext();

  return (
    <section aria-labelledby="cashflow-summary-title">
      <h2 id="cashflow-summary-title" className="fintrack-section-title">
        {t('reportsPage.cashFlowReport.summaryTitle', { defaultValue: 'Cash Flow Summary' })}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <SummaryItemCard 
          title={t('reportsPage.cashFlowReport.totalIncome', { defaultValue: 'Total Income' })} 
          amount={totalIncome} 
          iconClass="fas fa-arrow-up"
          formatCurrency={formatCurrency}
          baseColorClass="text-success dark:text-green-400"
        />
        <SummaryItemCard 
          title={t('reportsPage.cashFlowReport.totalExpenses', { defaultValue: 'Total Expenses' })} 
          amount={totalExpenses} 
          iconClass="fas fa-arrow-down"
          formatCurrency={formatCurrency}
          baseColorClass="text-danger dark:text-red-400"
        />
        <SummaryItemCard 
          title={t('reportsPage.cashFlowReport.netCashFlow', { defaultValue: 'Net Cash Flow' })} 
          amount={netCashFlow} 
          iconClass="fas fa-balance-scale" 
          formatCurrency={formatCurrency}
          baseColorClass={netCashFlow >= 0 ? "text-primary dark:text-primaryLight" : "text-danger dark:text-red-400"}
        />
      </div>
    </section>
  );
};

export default CashFlowSummary;
