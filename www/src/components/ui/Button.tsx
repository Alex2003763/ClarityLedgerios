
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles = "font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-darkbg transition-all duration-200 ease-in-out flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md";

  // Updated variant styles based on FinTrack theme
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primaryDark focus:ring-primaryDark dark:hover:bg-primaryLight hover:shadow-primary/30 focus:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-accent text-white hover:bg-blue-600 focus:ring-blue-700 dark:hover:bg-sky-400 hover:shadow-accent/30 focus:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]', // Using accent for secondary
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-red-700 dark:hover:bg-red-400 hover:shadow-danger/30 focus:shadow-danger/30',
    ghost: 'bg-transparent text-primary hover:bg-primary/10 focus:ring-primary dark:text-primaryLight dark:hover:bg-primaryLight/10 shadow-none hover:shadow-none',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary/10 focus:ring-primary dark:text-primaryLight dark:border-primaryLight dark:hover:bg-primaryLight/10 shadow-none hover:shadow-none'
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs', // Adjusted for a more compact 'sm' button
    md: 'px-5 py-2.5 text-sm sm:text-base',
    lg: 'px-7 py-3 text-base sm:text-lg',
  };

  const spinnerColor = (variant === 'primary' || variant === 'secondary' || variant === 'danger') 
    ? "text-white" 
    : "text-primary dark:text-primaryLight";

  const spinnerMargin = children ? (size === 'sm' ? 'mr-1.5' : 'mr-2') : 'mr-0';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className={`animate-spin h-4 w-4 ${spinnerMargin} ${spinnerColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className={`flex-shrink-0 ${children ? (size === 'sm' ? 'mr-1.5' : 'mr-2') : ''}`}>{leftIcon}</span>}
      {children && <span className="flex-grow-0 text-center whitespace-nowrap">{children}</span>}
      {rightIcon && !isLoading && <span className={`flex-shrink-0 ${children ? (size === 'sm' ? 'ml-1.5' : 'ml-2') : ''}`}>{rightIcon}</span>}
    </button>
  );
};

export default Button;