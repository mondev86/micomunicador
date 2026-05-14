import React from 'react';
import { motion } from 'framer-motion';
import { iconMap, Pictogram } from '../data/categories';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PictogramIconProps {
  name: string;
  className?: string;
}

export const PictogramIcon: React.FC<PictogramIconProps> = ({ name, className }) => {
  const Icon = iconMap[name];
  if (!Icon) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: [0, -4, 0]
      }}
      transition={{
        y: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        },
        scale: { duration: 0.3 }
      }}
      whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
      whileTap={{ scale: 0.85 }}
      className={cn('flex items-center justify-center', className)}
    >
      <Icon size={48} strokeWidth={2.5} />
    </motion.div>
  );
};

interface PictogramCardProps {
  pictogram: Pictogram;
  color: string;
  onClick: (p: Pictogram) => void;
}

export const PictogramCard: React.FC<PictogramCardProps> = ({ pictogram, color, onClick }) => {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onClick={() => onClick(pictogram)}
      className={cn(
        'w-full flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all duration-200 aspect-square shadow-sm',
        color
      )}
    >
      <PictogramIcon name={pictogram.iconName} className="mb-2" />
      <span className="text-sm font-bold text-center leading-tight">
        {pictogram.word}
      </span>
    </motion.button>
  );
};
