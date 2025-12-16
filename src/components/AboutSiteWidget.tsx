import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Code, Github } from 'lucide-react';

interface AboutSiteWidgetProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export function AboutSiteWidget({ isActive, onClick, className = '' }: AboutSiteWidgetProps) {
  const [view, setView] = useState<'about' | 'whatsnext'>('about');

  const handleToggle = (e: React.MouseEvent, newView: 'about' | 'whatsnext') => {
    e.stopPropagation();
    setView(newView);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border flex flex-col h-full ${
        isActive 
          ? 'border-green-500 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <Code className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-gray-900 dark:text-gray-100 flex-1">About this site</h3>
        <a
          href="https://github.com/JAShapero/personal-website"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="View on GitHub"
        >
          <Github className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" />
        </a>
      </div>

      {/* Toggle */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <button
          onClick={(e) => handleToggle(e, 'about')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-all ${
            view === 'about'
              ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          About
        </button>
        <button
          onClick={(e) => handleToggle(e, 'whatsnext')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-all ${
            view === 'whatsnext'
              ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          What's next
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
        {view === 'about' ? (
          <div className="space-y-3">
            <p>Playground to experiment with AI.</p>
            <p>Active widget sets chat context (e.g., "about", "music"). If no widget selected, planning agent will determine which tools to use.</p>
            <p>Chat uses Claude with tool calling to fetch static data (e.g., about-me.md) and live data (e.g., Spotify and Strava APIs) to discuss the topic.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <ol className="space-y-2 pl-5" style={{ listStyleType: 'decimal', listStylePosition: 'outside' }}>
              <li>Improve planning agent and automatic tool routing</li>
              <li>Retry logic</li>
              <li>Improve response format, quality and vibe</li>
              <li>Mobile responsiveness 😅</li>
            </ol>
          </div>
        )}
      </div>
    </motion.div>
  );
}
