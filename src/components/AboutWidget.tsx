import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, X } from 'lucide-react';

interface AboutWidgetProps {
  isActive: boolean;
  onClick: () => void;
}

interface Photo {
  url: string;
  caption: string;
}

const photos: Photo[] = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', caption: 'Mountain sunset' },
  { url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop', caption: 'Forest trail' },
  { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop', caption: 'Summit view' },
  { url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=400&fit=crop', caption: 'Mountain biking' }
];

export function AboutWidget({ isActive, onClick }: AboutWidgetProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handlePhotoClick = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation(); // Prevent widget click from firing
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <>
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
        <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 mb-6">
          <p>Hey, I'm Jeremy 👋</p>
          <p>I'm a PM based in Boulder, Colorado.</p>
          <p>I love building data and AI products, and I love tackling the ambiguity of 0 to 1 opportunities.</p>
          <p>I'm a twin dad and am passionate about the outdoors and music.</p>
        </div>
        
        {/* Photo Gallery */}
        <div className="grid grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              onClick={(e) => handlePhotoClick(e, photo)}
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-zoom-in"
            >
              <img 
                src={photo.url} 
                alt={photo.caption}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Photo Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            style={{ margin: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full"
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Photo */}
              <img
                src={selectedPhoto.url.replace('w=400&h=400', 'w=1200&h=1200')}
                alt={selectedPhoto.caption}
                className="w-full h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
