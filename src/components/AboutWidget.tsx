import React from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';

interface AboutWidgetProps {
  isActive: boolean;
  onClick: () => void;
}

export function AboutWidget({ isActive, onClick }: AboutWidgetProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border ${
        isActive 
          ? 'border-blue-500 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-gray-900 dark:text-gray-100">About Me</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        Full-stack developer based in Colorado. I love building beautiful, functional web experiences 
        and spending my free time exploring the mountains.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">React</span>
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">TypeScript</span>
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">Node.js</span>
      </div>
    </motion.div>
  );
}