
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAppContext } from '../../contexts/AppContext';

interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseTrendChartProps {
  data: MonthlyTrendData[];
}

const IncomeExpenseTrendChart: React.FC<IncomeExpenseTrendChartProps> = ({ data }) => {
  const { t, isDarkMode, formatCurrency, selectedCurrencySymbol } = useAppContext();

  const tooltipStyle = {
    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)', // dark:bg-slate-800
    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, // dark:border-gray-700
    borderRadius: '0.5rem',
    color: isDarkMode ? '#f3f4f6' : '#1f2937', // dark:text-gray-100
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '8px 12px',
  };

  const legendStyle = { 
    fontSize: '13px', 
    paddingTop: '15px', 
    color: isDarkMode ? '#9ca3af' : '#6b7280' // text-gray-400 dark:text-gray-500
  };

  const tickColor = isDarkMode ? '#9ca3af' : '#6b7280'; // For XAxis and YAxis ticks

  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t('dashboard.charts.noTrendData', { defaultValue: 'Not enough data for trend chart.'})}</p>;
  }
  
  // Custom Tooltip Formatter
  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle}>
          <p className="label font-semibold mb-1">{`${label}`}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color }} className="text-sm">
              {`${pld.name}: ${formatCurrency(pld.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5, right: 20, left: -10, bottom: 5, // Adjusted left margin for Y-axis
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `${selectedCurrencySymbol}${value / 1000}k`} tick={{ fill: tickColor, fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}/>
          <Legend wrapperStyle={legendStyle} />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#4caf50" // success color
            strokeWidth={2} 
            activeDot={{ r: 6, strokeWidth: 2, fill: '#4caf50' }} 
            dot={{ r: 3, strokeWidth: 1 }}
            name={t('summaryDisplay.totalIncome', { defaultValue: 'Income' })}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#f44336" // danger color
            strokeWidth={2} 
            activeDot={{ r: 6, strokeWidth: 2, fill: '#f44336' }} 
            dot={{ r: 3, strokeWidth: 1 }}
            name={t('summaryDisplay.totalExpenses', { defaultValue: 'Expenses' })}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseTrendChart;
