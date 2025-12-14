import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';

interface BooksWidgetProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

// Mock Hardcover API data - Replace with real API call
// To integrate with Hardcover API:
// 1. Get your API key from Hardcover
// 2. Fetch currently reading books: GET https://api.hardcover.app/v1/users/{username}/reading
// 3. Or use GraphQL endpoint: https://hardcover.app/graphql
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

  useEffect(() => {
    // TODO: Replace with actual Hardcover API call
    // Example GraphQL query:
    // query {
    //   me {
    //     currently_reading {
    //       book {
    //         title
    //         contributions { author { name } }
    //         image
    //       }
    //       progress_pages
    //     }
    //   }
    // }
    
    // For now, using mock data
    setBooks(mockBooksData);
  }, []);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border min-h-[420px] flex flex-col ${
        isActive 
          ? 'border-orange-500 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
          <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-gray-900 dark:text-gray-100">Currently Reading</h3>
      </div>

      <div className="space-y-4">
        {books.map((book) => (
          <div key={book.id} className="flex gap-3">
            {/* Book Cover */}
            <div className="w-16 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src={book.cover_url} 
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm truncate text-gray-900 dark:text-gray-100">{book.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{book.author}</p>
              
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${book.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-orange-500"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{book.progress}%</span>
                  <span>{book.current_page} / {book.total_pages}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* API Integration Note */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Connect to Hardcover API for live data
      </div>
    </motion.div>
  );
}