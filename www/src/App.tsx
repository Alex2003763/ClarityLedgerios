

import React, { useState, useCallback, useEffect } from 'react';
import Dashboard from './components/core/Dashboard';
import SettingsPage from './components/core/SettingsPage';
import Sidebar from './components/core/Sidebar'; 
import TopBar from './components/core/TopBar';   
import HelpCenterPage from './components/core/HelpCenterPage'; 
import TransactionsPage from './components/core/TransactionsPage'; 
import ReportsPage from './components/core/ReportsPage'; 
import BillScanPage from './components/ocr/BillScanPage';
import RecurringTransactionsPage from './components/core/RecurringTransactionsPage';
import BottomNavigationBar from './components/core/BottomNavigationBar'; // New Bottom Nav
import { AppProvider, useAppContext } from './contexts/AppContext';
import { processRecurringTransactions } from './services/recurringTransactionService';
import { LAST_RECURRING_PROCESSING_TIME_KEY } from './constants';


type Page = 'dashboard' | 'settings' | 'help' | 'transactions' | 'reports' | 'billScan' | 'recurring';

const AppContent: React.FC = () => {
  const { t } = useAppContext();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(window.innerWidth > 1024); // Default open on larger screens (lg)
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768); // md breakpoint

  // Effect for processing recurring transactions on app load
  useEffect(() => {
    const lastRunTime = localStorage.getItem(LAST_RECURRING_PROCESSING_TIME_KEY);
    const now = new Date().getTime();
    const twelveHours = 12 * 60 * 60 * 1000;

    if (!lastRunTime || (now - parseInt(lastRunTime, 10) > twelveHours)) {
      console.log("Processing recurring transactions...");
      const result = processRecurringTransactions();
      if (result.createdCount > 0) {
        console.log(`${result.createdCount} recurring transactions generated.`);
      }
      if (result.errors.length > 0) {
        console.error("Errors during recurring transaction processing:", result.errors);
      }
      localStorage.setItem(LAST_RECURRING_PROCESSING_TIME_KEY, now.toString());
    }
  }, []);


  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
    // No need to manage sidebar visibility here for mobile, as it's replaced by bottom bar
  }, []);
  
  const toggleDesktopSidebar = useCallback(() => {
    if (!isMobileView) {
      setIsDesktopSidebarOpen(prev => !prev);
    }
  }, [isMobileView]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768; // md breakpoint
      setIsMobileView(mobile);
      if (!mobile) { // On desktop
        setIsDesktopSidebarOpen(window.innerWidth > 1024); // lg breakpoint for auto-open desktop sidebar
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []); 
  
  let pageTitle = '';
  if (currentPage === 'dashboard') pageTitle = t('navbar.dashboard');
  if (currentPage === 'settings') pageTitle = t('navbar.settings');
  if (currentPage === 'help') pageTitle = t('helpCenterPage.title');
  if (currentPage === 'transactions') pageTitle = t('navbar.transactions');
  if (currentPage === 'reports') pageTitle = t('navbar.reports');
  if (currentPage === 'billScan') pageTitle = t('navbar.billScan', { defaultValue: 'Scan Bill' });
  if (currentPage === 'recurring') pageTitle = t('navbar.recurring', { defaultValue: 'Recurring Transactions' });

  const mainContentMarginClass = isMobileView 
    ? 'ml-0 pb-24' // pb-24 for taller bottom nav bar (h-20 -> 5rem, pb-24 -> 6rem)
    : (isDesktopSidebarOpen ? 'md:ml-64' : 'md:ml-20');

  return (
    <div className="flex min-h-screen bg-lightbg dark:bg-darkbg transition-colors duration-300 w-full">
      {!isMobileView && (
        <Sidebar 
            onNavigate={handleNavigate} 
            currentPage={currentPage} 
            isOpen={isDesktopSidebarOpen} 
            toggleSidebar={toggleDesktopSidebar} /* For desktop collapse/expand icon if any */
        />
      )}
      
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
                   ${mainContentMarginClass}`}
      >
        <TopBar 
            pageTitle={pageTitle} 
            toggleSidebar={toggleDesktopSidebar} 
            isSidebarOpen={isDesktopSidebarOpen} 
            isMobileView={isMobileView} 
            onNavigate={handleNavigate} // Pass navigation handler
        />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'settings' && <SettingsPage />}
          {currentPage === 'help' && <HelpCenterPage />}
          {currentPage === 'transactions' && <TransactionsPage />}
          {currentPage === 'reports' && <ReportsPage />}
          {currentPage === 'billScan' && <BillScanPage onNavigateToTransactions={() => handleNavigate('transactions')} />}
          {currentPage === 'recurring' && <RecurringTransactionsPage />}
        </main>
        <footer className={`bg-white dark:bg-darkContentBg text-grayText text-center p-4 text-sm border-t border-gray-200 dark:border-darkBorder transition-colors duration-300 ${isMobileView ? 'hidden' : ''}`}>
           {t('footer', { year: new Date().getFullYear().toString() })}
        </footer>
      </div>
      {isMobileView && <BottomNavigationBar onNavigate={handleNavigate} currentPage={currentPage} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
