'use client';

import { FC, useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: () => void;
}

const Notification: FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-400',
          border: 'border-red-500',
          shadow: 'shadow-[4px_4px_0px_0px_#DC2626]',
          hover: 'hover:shadow-[2px_2px_0px_0px_#DC2626]',
          emoji: '💀'
        };
      case 'success':
        return {
          bg: 'bg-green-400',
          border: 'border-green-500',
          shadow: 'shadow-[4px_4px_0px_0px_#16A34A]',
          hover: 'hover:shadow-[2px_2px_0px_0px_#16A34A]',
          emoji: '✨'
        };
      default:
        return {
          bg: 'bg-[#8B5CF6]',
          border: 'border-[#7C3AED]',
          shadow: 'shadow-[4px_4px_0px_0px_#5B21B6]',
          hover: 'hover:shadow-[2px_2px_0px_0px_#5B21B6]',
          emoji: '🔥'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50
        min-w-[300px] max-w-[400px]
        px-4 py-3 rounded-xl
        ${styles.bg} text-white
        border-4 ${styles.border}
        ${styles.shadow}
        transform transition-all duration-200
        hover:translate-x-[2px] hover:translate-y-[2px]
        ${styles.hover}
        font-bold
        animate-slide-in
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{styles.emoji}</span>
          <span>{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors ml-2 text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification; 