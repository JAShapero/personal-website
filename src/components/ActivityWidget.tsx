import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mountain, Bike } from 'lucide-react';

interface ActivityWidgetProps {
  type: 'snowboarding' | 'biking';
  isActive: boolean;
  onClick: () => void;
}

const activityData = {
  snowboarding: {
    lastDate: new Date('2024-02-15'),
    icon: Mountain,
    color: 'cyan',
    title: 'Snowboarding',
    bgImage: 'https://images.unsplash.com/photo-1612525681661-d31d1c154954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHNub3dib2FyZGluZ3xlbnwxfHx8fDE3NjU2MDA2Njl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  biking: {
    lastDate: new Date('2024-12-01'),
    icon: Bike,
    color: 'green',
    title: 'Biking',
    bgImage: 'https://images.unsplash.com/photo-1752009227157-8523fc97dfa5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWNsaW5nJTIwYWR2ZW50dXJlfGVufDF8fHx8MTc2NTYwMDY2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  }
};

function calculateTimeSince(date: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today!';
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''}`;
}

export function ActivityWidget({ type, isActive, onClick }: ActivityWidgetProps) {
  const data = activityData[type];
  const Icon = data.icon;
  const [timeSince, setTimeSince] = useState(calculateTimeSince(data.lastDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSince(calculateTimeSince(data.lastDate));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [data.lastDate]);

  const colorClasses = {
    cyan: {
      border: 'border-cyan-500',
      shadow: 'shadow-cyan-500/20',
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-400'
    },
    green: {
      border: 'border-green-500',
      shadow: 'shadow-green-500/20',
      bg: 'bg-green-500/20',
      text: 'text-green-400'
    }
  };

  const colors = colorClasses[data.color];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transition-all border-2 ${
        isActive ? `${colors.border} shadow-lg ${colors.shadow}` : 'border-transparent hover:border-slate-700'
      }`}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${data.bgImage})` }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 ${colors.bg} rounded-lg`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <h3>{data.title}</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-xs text-slate-400 mb-1">Last session</p>
          <p className={`text-3xl ${colors.text}`}>{timeSince}</p>
          <p className="text-xs text-slate-500 mt-1">ago</p>
        </div>
      </div>
    </motion.div>
  );
}
