

import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

type PageType = 'dashboard' | 'settings' | 'help' | 'transactions' | 'reports' | 'billScan' | 'recurring';

interface BottomNavItemProps {
  label: string;
  iconClass: string;
  isActive: boolean;
  onClick: () => void;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ label, iconClass, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs transition-colors duration-200 
                  ${isActive ? 'text-primary dark:text-primaryLight' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primaryLight'}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <i className={`${iconClass} text-xl mb-0.5`}></i>
      <span>{label}</span>
    </button>
  );
};

interface BottomNavigationBarProps {
  onNavigate: (page: PageType) => void;
  currentPage: PageType;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ onNavigate, currentPage }) => {
  const { t } = useAppContext();

  // Added "Recurring" and "Reports" back. Settings remains in TopBar for mobile.
  const navItems: { page: PageType; labelKey: string; defaultLabel: string; iconClass: string }[] = [
    { page: 'dashboard', labelKey: 'navbar.dashboard', defaultLabel: 'Dashboard', iconClass: 'fas fa-home' },
    { page: 'transactions', labelKey: 'navbar.transactions', defaultLabel: 'Transactions', iconClass: 'fas fa-exchange-alt' },
    { page: 'billScan', labelKey: 'navbar.billScan', defaultLabel: 'Scan Bill', iconClass: 'fas fa-camera' },
    { page: 'recurring', labelKey: 'navbar.recurring', defaultLabel: 'Recurring', iconClass: 'fas fa-sync-alt' },
    { page: 'reports', labelKey: 'navbar.reports', defaultLabel: 'Reports', iconClass: 'fas fa-chart-pie' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-contentBg dark:bg-darkContentBg border-t border-gray-200 dark:border-darkBorder shadow-top-nav-bar z-40 flex md:hidden">
      {navItems.map(item => (
        <BottomNavItem
          key={item.page}
          label={t(item.labelKey, { defaultValue: item.defaultLabel })}
          iconClass={item.iconClass}
          isActive={currentPage === item.page}
          onClick={() => onNavigate(item.page)}
        />
      ))}
    </nav>
  );
};

export default BottomNavigationBar;