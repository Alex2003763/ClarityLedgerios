
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Input: React.FC<InputProps> = ({ label, id, error, containerClassName = '', className = '', leftIcon, type, value, onChange, ...props }) => {
  const showClearButton = value && String(value).length > 0 && 
                          ['text', 'search', 'url', 'tel', 'email', 'number', undefined].includes(type);

  const handleClearInput = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onChange) {
      // Simulate a ChangeEvent
      const syntheticEvent = {
        target: {
          value: '',
          name: props.name || '', // Use name if available
          id: id || '',           // Use id if available
          type: type || 'text',
        } as HTMLInputElement, // Cast to satisfy TypeScript, actual event properties might differ
        currentTarget: e.currentTarget.form?.elements.namedItem(props.name || id || '') as HTMLInputElement || e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement, // Try to get the actual input
        bubbles: true,
        cancelable: false,
        // Add other event properties if needed by consumers, though typically not for controlled components
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };
  
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-darkBorder'} 
                      rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary 
                      sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext 
                      placeholder-gray-400 dark:placeholder-gray-500
                      ${leftIcon ? 'pl-10' : ''}
                      ${showClearButton ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {showClearButton && (
          <button
            type="button"
            onClick={handleClearInput}
            className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
            aria-label="Clear input"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
