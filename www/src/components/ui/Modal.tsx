
import React, { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsMounted(true);
      }, 10); 
      return () => clearTimeout(timer);
    } else {
      setIsMounted(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const backdropBaseClasses = "fixed inset-0 z-50 flex items-center justify-center bg-black p-4 transition-opacity duration-300 ease-in-out";
  const backdropAnimatedClasses = isMounted ? 'bg-opacity-50 dark:bg-opacity-70' : 'bg-opacity-0';

  const contentBaseClasses = `bg-white dark:bg-darkSurface rounded-lg shadow-xl flex flex-col w-full ${sizeClasses[size]} transform transition-all duration-300 ease-in-out`;
  const contentAnimatedClasses = isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95';

  return (
    <div 
      className={`${backdropBaseClasses} ${backdropAnimatedClasses}`}
      onClick={onClose}
    >
      <div 
        className={`${contentBaseClasses} ${contentAnimatedClasses}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-darkBorder">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)] sm:max-h-[calc(85vh-120px)] custom-scrollbar"> {/* Adjusted max-height and padding moved here for content */}
            {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;