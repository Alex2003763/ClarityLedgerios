
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, TooltipProps } from 'recharts';
import { useAppContext } from '../../contexts/AppContext';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';


interface TopCategoryData {
  name: string; // Category name (already translated)
  value: number; // Total amount
}

interface TopExpenseCategoriesChartProps {
  data: TopCategoryData[];
}

const CHART_COLORS_BAR = [ // Different set or reuse from SpendingByCategoryChart
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#3b82f6', '#22c55e', '#d946ef', '#6366f1',
];

const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
  const { formatCurrency, isDarkMode } = useAppContext();
  
  if (active && payload && payload.length) {
    const tooltipStyle = {
      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
      borderRadius: '0.5rem',
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '10px 15px',
      fontSize: '0.8rem',
    };

    return (
      <div style={tooltipStyle}>
        <p className="label font-semibold mb-1 text-sm">{`${payload[0].payload.name}`}</p> {/* Use payload.name for category */}
        <p style={{ color: payload[0].fill }} className="mb-1">
          {`${payload[0].name}: ${formatCurrency(payload[0].value as number)}`} {/* payload[0].name is 'value' here, label is category */}
        </p>
      </div>
    );
  }
  return null;
};


const TopExpenseCategoriesChart: React.FC<TopExpenseCategoriesChartProps> = ({ data }) => {
  const { t, isDarkMode, selectedCurrencySymbol, formatCurrency } = useAppContext();

  const tickColor = isDarkMode ? '#9ca3af' : '#6b7280';

  if (!data || data.length === 0) {
    return <p className="text-center text-grayText dark:text-gray-400 py-10">{t('reportsPage.topExpenseCategoriesChart.noData')}</p>;
  }
  
  // Y-axis labels can be long, so adjust left margin
  const yAxisWidth = Math.max(...data.map(d => d.name.length)) > 15 ? 120 : 100;


  return (
    <div style={{ width: '100%', height: 300 + data.length * 15 }}> {/* Adjust height based on number of bars */}
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5, right: 30, left: yAxisWidth - 60, bottom: 5, // Adjust left margin dynamically for YAxis
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `${selectedCurrencySymbol}${value / 1000}k`} 
            tick={{ fill: tickColor, fontSize: 12 }} 
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: tickColor, fontSize: 12 }} 
            width={yAxisWidth}
            interval={0} // Show all category names
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
          {/* Legend might be redundant if colors are distinct enough or only one bar series */}
          {/* <Legend /> */}
          <Bar dataKey="value" barSize={20} name={t('transactionTable.amount', {defaultValue: "Amount"})}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS_BAR[index % CHART_COLORS_BAR.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopExpenseCategoriesChart;
