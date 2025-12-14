import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Loader2 } from 'lucide-react';

interface BooksWidgetProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  progress: number; // percentage 0-100
  total_pages: number;
  current_page: number;
}

const mockBooksData: Book[] = [
  {
    id: '1',
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMHJlYWRpbmd8ZW58MXx8fHwxNzY1NjAwODQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    progress: 65,
    total_pages: 352,
    current_page: 229
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMHJlYWRpbmd8ZW58MXx8fHwxNzY1NjAwODQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    progress: 34,
    total_pages: 320,
    current_page: 109
  }
];

export function BooksWidget({ isActive, onClick, className = '' }: BooksWidgetProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBooksData();
  }, []);

  const fetchBooksData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching books from /api/hardcover...');
      const response = await fetch('/api/hardcover');
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error response data:', errorData);
        
        // If Hardcover is not configured, endpoint doesn't exist (404), or server error, use mock data
        if (response.status === 401 || response.status === 500 || response.status === 404) {
          if (response.status === 404) {
            console.warn('API endpoint not found (404). If running locally, use "vercel dev" to test API endpoints.');
          } else {
            console.warn('Hardcover API not configured or error occurred, using mock data');
          }
          setBooks(mockBooksData);
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch books');
      }

      const data = await response.json();
      console.log('Hardcover API response:', data);
      
      if (data.books && data.books.length > 0) {
        console.log(`Loaded ${data.books.length} book(s) from Hardcover`);
        setBooks(data.books);
      } else {
        console.log('No books found in response, using mock data');
        setBooks(mockBooksData);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching Hardcover data:', err);
      console.error('Error details:', err.message, err.stack);
      setError('Failed to load books data');
      // Fallback to mock data on error
      console.warn('Falling back to mock data due to error');
      setBooks(mockBooksData);
      setLoading(false);
    }
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
          <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-gray-900 dark:text-gray-100">Currently Reading</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 flex-1">
          <Loader2 className="w-6 h-6 text-green-600 dark:text-green-400 animate-spin" />
        </div>
      ) : error && books.length === 0 ? (
        <div className="text-center py-4 text-sm text-red-500 dark:text-red-400 flex-1">
          {error}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 flex-1">
          No books currently being read
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {books.map((book) => (
            <div key={book.id} className="flex gap-3">
              {/* Book Cover */}
              <div className="w-16 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {book.cover_url ? (
                  <img 
                    src={book.cover_url} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                    No Cover
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm truncate text-gray-900 dark:text-gray-100">{book.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{book.author}</p>
                
                {/* Progress Bar */}
                {book.total_pages > 0 && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${book.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-green-500"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{book.progress}%</span>
                      <span>{book.current_page} / {book.total_pages}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}