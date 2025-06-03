
import React from 'react';

interface LogoProps {
  className?: string;
  isSidebarOpen?: boolean; // To adjust styles if needed when sidebar is collapsed
}

export const Logo: React.FC<LogoProps> = ({ className, isSidebarOpen }) => (
  <i className={`fas fa-chart-line ${className || 'text-white'}`}></i>
  // If you want to keep the SVG and just change its appearance:
  // <svg 
  //   className={className} // text-primary dark:text-primary-light will be applied by parent
  //   viewBox="0 0 24 24" 
  //   fill="none" 
  //   xmlns="http://www.w3.org/2000/svg"
  // >
  //   <path 
  //     d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" 
  //     fill="currentColor"
  //   />
  //   <path 
  //     d="M12 6C9.79 6 8 7.79 8 10C8 11.48 8.85 12.77 10 13.45V15C10 15.55 10.45 16 11 16H13C13.55 16 14 15.55 14 15V13.45C15.15 12.77 16 11.48 16 10C16 7.79 14.21 6 12 6ZM12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12Z" 
  //     fill="currentColor"
  //   />
  // </svg>
);