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
  { url: '/images/5ba3cfbc-24f8-4387-882a-1ddcf4bf67b1.jpg', caption: 'Beach sunset' },
  { url: '/images/90841310-BLK-00139.jpeg', caption: 'Surfing at sunset' },
  { url: '/images/cc340051-8721-4bc1-ae20-06ee62876c9f.jpg', caption: 'Family by the river' },
  { url: '/images/IDG_20250705_121627_157.jpeg', caption: 'Mountain biking' }
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
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border flex flex-col h-full ${
          isActive 
            ? 'border-blue-500 shadow-md' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
        }`}
        style={{ minHeight: 'fit-content' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-gray-900 dark:text-gray-100">About Me</h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 mb-4 flex-1">
          <p>Hey, I'm Jeremy 👋</p>
          <p>I'm a PM based in Boulder, Colorado.</p>
          <p>I love building data and AI products, and I love tackling the ambiguity of 0 to 1 opportunities.</p>
          <p>I'm a twin dad and am passionate about the outdoors and music.</p>
        </div>
        
        {/* Photo Gallery */}
        <div className="grid grid-cols-4 gap-3 mt-auto">
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
              className="relative max-w-lg max-h-[70vh] w-full"
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
                src={selectedPhoto.url}
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
