import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChartData } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface CategoryPieChartProps {
  data: PieChartData[];
}

const COLORS = [
  '#4f46e5', // primary
  '#0ea5e9', // secondary
  '#10b981', // accent
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#d946ef', // fuchsia-500
  '#6366f1', // indigo-500 (primary-light)
];

const RADIAN = Math.PI / 180;

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const { t, isDarkMode, formatCurrency } = useAppContext();

  const renderCustomizedLabel = <T extends { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; index: number; name: string; } >(
    { cx, cy, midAngle, innerRadius, outerRadius, percent }: T
    ): React.ReactNode => {
    if (percent < 0.05) return null; 
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const labelColor = isDarkMode ? '#FFF' : '#FFF'; 

    return (
      <text x={x} y={y} fill={labelColor} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400">{t('categoryPieChart.noData')}</p>;
  }

  const tooltipStyle = {
    backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
    border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`, 
    borderRadius: '0.375rem', 
    color: isDarkMode ? '#f3f4f6' : '#1f2937', 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  };

  const legendStyle = { 
    fontSize: '12px', 
    paddingTop: '10px', 
    color: isDarkMode ? '#9ca3af' : '#6b7280' 
  };


  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)} 
            contentStyle={tooltipStyle}
            cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          />
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center" 
            wrapperStyle={legendStyle}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryPieChart;