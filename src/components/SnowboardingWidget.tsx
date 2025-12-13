import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mountain, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SnowboardingWidgetProps {
  isActive: boolean;
  onClick: () => void;
}

interface SnowboardingEntry {
  date: string;
  location: string;
  season: string;
  days: number;
  parsedDate: Date;
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse date string like "Monday, November 18" or "Wednesday, April 2"
function parseDate(dateStr: string): Date {
  // Remove day of week if present (e.g., "Monday, November 18" -> "November 18")
  const datePart = dateStr.includes(',') ? dateStr.split(',').slice(1).join(',').trim() : dateStr;
  
  // Parse "November 18" or "April 2" format
  // Determine which year based on the month
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Create date object
  const date = new Date(`${datePart}, ${currentYear}`);
  
  // If the date is in the future (but we're in the same calendar year), 
  // it's likely from the previous season (which starts in previous calendar year)
  // Snowboarding season typically runs Nov-April, so Nov-Dec are current year, Jan-May could be next year
  if (date > now) {
    // If it's November or December, it might be from last year's season start
    // Otherwise, subtract a year
    if (date.getMonth() >= 10 || date.getMonth() <= 4) {
      date.setFullYear(currentYear - 1);
    }
  }
  
  return date;
}

// Normalize season format: "24-'25" -> "2024-25"
function normalizeSeason(season: string): string {
  if (season.includes("'")) {
    const match = season.match(/(\d+)-'(\d+)/);
    if (match) {
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);
      return `20${start}-${end}`;
    }
  }
  return season;
}

// Format date for chart display
function formatDateForChart(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

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
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSeason, setCurrentSeason] = useState<string>('');
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    const loadSnowboardingData = async () => {
      try {
        setLoading(true);
        // Fetch CSV file
        const response = await fetch('/data/snowboarding.csv');
        if (!response.ok) {
          throw new Error('Failed to load snowboarding data');
        }
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.trim().split('\n');
        const entries: SnowboardingEntry[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const [date, location, season, daysStr] = parseCSVLine(lines[i]);
          const normalizedSeason = normalizeSeason(season);
          const parsedDate = parseDate(date);
          
          entries.push({
            date,
            location,
            season: normalizedSeason,
            days: parseInt(daysStr),
            parsedDate,
          });
        }
        
        // Sort by date
        entries.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
        
        // Get all seasons
        const seasons = Array.from(new Set(entries.map(e => e.season))).sort();
        const latestSeason = seasons[seasons.length - 1] || '';
        const previousSeason = seasons[seasons.length - 2] || '';
        
        setCurrentSeason(latestSeason);
        
        // Get latest total days
        const latestEntry = entries.filter(e => e.season === latestSeason);
        setTotalDays(latestEntry[latestEntry.length - 1]?.days || 0);
        
        // Create chart data - show cumulative progress over time
        // Group by season and create data points for each entry
        const chartDataPoints: any[] = [];
        
        // For each season, create a data point for each entry
        const latestSeasonEntries = entries.filter(e => e.season === latestSeason);
        const previousSeasonEntries = previousSeason ? entries.filter(e => e.season === previousSeason) : [];
        
        // Combine all dates and sort
        const allEntryDates = new Set<number>();
        entries.forEach(e => allEntryDates.add(e.parsedDate.getTime()));
        const sortedTimes = Array.from(allEntryDates).sort((a, b) => a - b);
        
        sortedTimes.forEach(time => {
          const date = new Date(time);
          const dateStr = formatDateForChart(date);
          const dataPoint: any = { date: dateStr };
          
          // Find latest entry up to this date for each season
          const latestUpToDate = latestSeasonEntries
            .filter(e => e.parsedDate.getTime() <= time)
            .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())[0];
          
          const previousUpToDate = previousSeason ? previousSeasonEntries
            .filter(e => e.parsedDate.getTime() <= time)
            .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())[0] : null;
          
          dataPoint[latestSeason] = latestUpToDate?.days || null;
          if (previousSeason && previousUpToDate) {
            dataPoint[previousSeason] = previousUpToDate.days;
          }
          
          // Only add if we have data for at least one season
          if (latestUpToDate || previousUpToDate) {
            chartDataPoints.push(dataPoint);
          }
        });
        
        setChartData(chartDataPoints);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading snowboarding data:', err);
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    };
    
    loadSnowboardingData();
  }, []);

  const getSeasonLabel = (season: string) => {
    return season.replace('20', "'");
  };

  if (loading) {
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
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400 animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (error) {
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
        <div className="text-center py-8 text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      </motion.div>
    );
  }

  const seasons = Array.from(new Set(chartData.flatMap(d => Object.keys(d).filter(k => k !== 'date')))).sort();
  const previousSeason = seasons[seasons.length - 2];
  const latestSeason = seasons[seasons.length - 1];

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
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af" 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              className="dark:stroke-gray-600"
              angle={-45}
              textAnchor="end"
              height={60}
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
            {previousSeason && (
              <Line 
                type="monotone" 
                dataKey={previousSeason} 
                stroke="#6366f1" 
                strokeWidth={2}
                name={getSeasonLabel(previousSeason)}
                dot={{ fill: '#6366f1', r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            )}
            <Line 
              type="monotone" 
              dataKey={latestSeason} 
              stroke="#06b6d4" 
              strokeWidth={2}
              name={getSeasonLabel(latestSeason)}
              dot={{ fill: '#06b6d4', r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Season progress: {totalDays} days</span>
        <span>Goal: 35 days</span>
      </div>
    </motion.div>
  );
}