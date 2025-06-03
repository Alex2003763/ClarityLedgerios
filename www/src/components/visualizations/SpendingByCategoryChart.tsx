
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from 'recharts';
import { useAppContext } from '../../contexts/AppContext';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface MonthlyCategorySpending {
  month: string;
  [category: string]: number | string;
}

interface SpendingByCategoryChartProps {
  data: MonthlyCategorySpending[];
  categories: string[]; // List of unique category names (translated)
}

// Reusable colors, can be expanded
const CHART_COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#3b82f6', '#22c55e', '#d946ef', '#6366f1',
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#14b8a6',
  '#06b6d4', '#a855f7', '#d81b60', '#f43f5e', '#0369a1'
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
        <p className="label font-semibold mb-2 text-sm">{`${label}`}</p>
        {payload.map((pld) => (
          <p key={pld.name} style={{ color: pld.color }} className="mb-1">
            {`${pld.name}: ${formatCurrency(pld.value as number)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SpendingByCategoryChart: React.FC<SpendingByCategoryChartProps> = ({ data, categories }) => {
  const { t, isDarkMode, selectedCurrencySymbol } = useAppContext();

  const legendStyle = { 
    fontSize: '13px', 
    paddingTop: '15px', 
    color: isDarkMode ? '#9ca3af' : '#6b7280'
  };
  const tickColor = isDarkMode ? '#9ca3af' : '#6b7280';

  if (categories.length === 0 || data.length === 0) {
    return <p className="text-center text-grayText dark:text-gray-400 py-10">{t('reportsPage.spendingByCategoryChart.noData')}</p>;
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5, right: 20, left: 0, bottom: 25, // Increased bottom margin for legend
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 12 }} />
          <YAxis 
            tickFormatter={(value) => `${selectedCurrencySymbol}${value / 1000}k`} 
            tick={{ fill: tickColor, fontSize: 12 }}
            width={selectedCurrencySymbol.length > 2 ? 60 : (selectedCurrencySymbol.length > 1 ? 50 : 40)} // Adjust YAxis width
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
          <Legend wrapperStyle={legendStyle} />
          {categories.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 2, fill: CHART_COLORS[index % CHART_COLORS.length] }}
              dot={{ r: 3, strokeWidth: 1 }}
              name={category} // Already translated from ReportsPage
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingByCategoryChart;
