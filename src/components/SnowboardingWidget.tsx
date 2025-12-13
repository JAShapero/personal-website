import React from 'react';
import { motion } from 'motion/react';
import { Mountain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SnowboardingWidgetProps {
  isActive: boolean;
  onClick: () => void;
}

// Mock data for last winter (2023-2024 season)
const lastWinterData = [
  { date: 'Dec 1', lastWinter: 0, thisWinter: 0 },
  { date: 'Dec 15', lastWinter: 3, thisWinter: 0 },
  { date: 'Jan 1', lastWinter: 7, thisWinter: 0 },
  { date: 'Jan 15', lastWinter: 12, thisWinter: 0 },
  { date: 'Feb 1', lastWinter: 18, thisWinter: 0 },
  { date: 'Feb 15', lastWinter: 23, thisWinter: 0 },
  { date: 'Mar 1', lastWinter: 28, thisWinter: 0 },
  { date: 'Mar 15', lastWinter: 31, thisWinter: 0 },
];

// Mock data for this winter (2024-2025 season, in progress)
const thisWinterData = [
  { date: 'Dec 1', lastWinter: 0, thisWinter: 0 },
  { date: 'Dec 15', lastWinter: 3, thisWinter: 2 },
  { date: 'Jan 1', lastWinter: 7, thisWinter: null },
  { date: 'Jan 15', lastWinter: 12, thisWinter: null },
  { date: 'Feb 1', lastWinter: 18, thisWinter: null },
  { date: 'Feb 15', lastWinter: 23, thisWinter: null },
  { date: 'Mar 1', lastWinter: 28, thisWinter: null },
  { date: 'Mar 15', lastWinter: 31, thisWinter: null },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{payload[0].payload.date}</p>
        {payload.map((entry: any, index: number) => (
          entry.value !== null && (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} days
            </p>
          )
        ))}
      </div>
    );
  }
  return null;
};

export function SnowboardingWidget({ isActive, onClick }: SnowboardingWidgetProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border ${
        isActive 
          ? 'border-cyan-500 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg">
          <Mountain className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h3 className="text-gray-900 dark:text-gray-100">Snowboarding</h3>
      </div>
      
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={thisWinterData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af" 
              tick={{ fill: '#6b7280', fontSize: 11 }}
              className="dark:stroke-gray-600"
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
              className="dark:stroke-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: '#374151' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="lastWinter" 
              stroke="#6366f1" 
              strokeWidth={2}
              name="Last Winter"
              dot={{ fill: '#6366f1', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="thisWinter" 
              stroke="#06b6d4" 
              strokeWidth={2}
              name="This Winter"
              dot={{ fill: '#06b6d4', r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Season progress: 2/31 days</span>
        <span>Goal: 35 days</span>
      </div>
    </motion.div>
  );
}