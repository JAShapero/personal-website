import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Moon, Sun, Mail, Linkedin } from 'lucide-react';
import { AboutWidget } from './components/AboutWidget';
import { MusicWidget } from './components/MusicWidget';
import { SnowboardingWidget } from './components/SnowboardingWidget';
import { BikeWidget } from './components/BikeWidget';
import { BooksWidget } from './components/BooksWidget';
import { AboutSiteWidget } from './components/AboutSiteWidget';
import { ChatPanel } from './components/ChatPanel';
import { DraggableWidget } from './components/DraggableWidget';

export type WidgetType = 'about' | 'music' | 'snowboarding' | 'biking' | 'books' | 'site' | null;

interface Widget {
  id: WidgetType;
  component: React.ComponentType<{ isActive: boolean; onClick: () => void; className?: string }>;
  className?: string;
}

function App() {
  const [activeWidget, setActiveWidget] = useState<WidgetType>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'about', component: AboutWidget },
    { id: 'music', component: MusicWidget },
    { id: 'snowboarding', component: SnowboardingWidget },
    { id: 'biking', component: BikeWidget },
    { id: 'site', component: AboutSiteWidget },
    // { id: 'books', component: BooksWidget, className: 'md:col-span-2' } // Hidden for now
  ]);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else {
      // Default to dark mode
      setIsDarkMode(true);
    }
  }, []);

  // Save theme preference and apply to document
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Measure header height and update spacer
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  const handleWidgetClick = (widget: WidgetType) => {
    setActiveWidget(widget);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
    setWidgets((prevWidgets) => {
      const newWidgets = [...prevWidgets];
      const [removed] = newWidgets.splice(dragIndex, 1);
      newWidgets.splice(hoverIndex, 0, removed);
      return newWidgets;
    });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50 transition-colors duration-300">
        {/* Fixed Header */}
        <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 w-full bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-semibold" style={{ fontSize: '1.6875rem' }}>Jeremy Shapero</h1>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Email Button */}
                <a
                  href="mailto:jeremy.shapero@gmail.com"
                  className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                  aria-label="Send email"
                >
                  <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </a>
                
                {/* LinkedIn Button */}
                <a
                  href="https://www.linkedin.com/in/jshapero/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                  aria-label="LinkedIn profile"
                >
                  <Linkedin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </a>
                
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Spacer to prevent content overlap with fixed header */}
        <div style={{ height: `${headerHeight}px` }}></div>

        <div className="container mx-auto px-4 py-12 max-w-7xl">

          {/* Main Layout */}
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min">
              {widgets.map((widget, index) => {
                const WidgetComponent = widget.component;
                return (
                  <DraggableWidget
                    key={widget.id}
                    id={widget.id as string}
                    index={index}
                    moveWidget={moveWidget}
                  >
                    <WidgetComponent
                      isActive={activeWidget === widget.id}
                      onClick={() => handleWidgetClick(widget.id)}
                      className={widget.className}
                    />
                  </DraggableWidget>
                );
              })}
            </div>

            {/* Chat Panel */}
            <div className="lg:sticky lg:self-start" style={{ top: `${headerHeight + 8}px` }}>
              <ChatPanel activeWidget={activeWidget} headerHeight={headerHeight} />
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;