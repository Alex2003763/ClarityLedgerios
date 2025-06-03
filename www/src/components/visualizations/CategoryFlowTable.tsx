
import React from 'react';

interface CategoryFlowItem {
  name: string;
  value: number;
}

interface CategoryFlowTableProps {
  title: string;
  data: CategoryFlowItem[];
  type: 'income' | 'expense';
  formatCurrency: (amount: number) => string;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const CategoryFlowTable: React.FC<CategoryFlowTableProps> = ({ title, data, type, formatCurrency, t }) => {
  const amountColorClass = type === 'income' 
    ? 'text-success dark:text-green-400' 
    : 'text-danger dark:text-red-400';

  return (
    <section className="fintrack-card h-full"> {/* Added h-full for consistent height in grid */}
      <h3 className="fintrack-section-title mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-center text-grayText dark:text-gray-400 py-8">
          {type === 'income' 
            ? t('reportsPage.cashFlowReport.noIncomeData', {defaultValue: 'No income data for this period.'}) 
            : t('reportsPage.cashFlowReport.noExpenseData', {defaultValue: 'No expense data for this period.'})
          }
        </p>
      ) : (
        <div className="overflow-x-auto max-h-[400px] custom-scrollbar"> {/* Added max-h and scrollbar */}
          <table className="min-w-full divide-y divide-gray-200 dark:divide-darkBorder">
            <thead className="bg-slate-50 dark:bg-darkSurface sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
                  {t('reportsPage.cashFlowReport.categoryHeader', {defaultValue: 'Category'})}
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-grayText dark:text-gray-400 uppercase tracking-wider">
                  {t('reportsPage.cashFlowReport.amountHeader', {defaultValue: 'Amount'})}
                </th>
              </tr>
            </thead>
            <tbody className="bg-contentBg dark:bg-darkContentBg divide-y divide-gray-100 dark:divide-slate-700">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-darkSurface/50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-lighttext dark:text-darktext">
                    {item.name}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${amountColorClass}`}>
                    {formatCurrency(item.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default CategoryFlowTable;
