
import React from 'react';
import { Logo } from '../ui/Logo'; 
import { useAppContext } from '../../contexts/AppContext';

type PageType = 'dashboard' | 'settings' | 'help' | 'transactions' | 'reports' | 'billScan' | 'recurring';

interface SidebarProps {
  onNavigate: (page: PageType) => void;
  currentPage: PageType;
  isOpen: boolean; // Controls expanded/collapsed state on desktop
  toggleSidebar: () => void; // For desktop collapse/expand icon if any (can be in TopBar)
}

const NavLink: React.FC<{
  onClick: () => void;
  iconClass: string;
  label: string;
  isActive: boolean;
  isSidebarOpen: boolean; 
}> = ({ onClick, iconClass, label, isActive, isSidebarOpen }) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`flex items-center py-3 px-4 my-1 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200 ease-in-out
                ${isActive ? 'bg-white/20 text-white font-semibold shadow-md' : 'text-gray-300'}
                ${!isSidebarOpen ? 'justify-center' : ''}`} 
    title={!isSidebarOpen ? label : undefined} 
  >
    <i className={`${iconClass} text-lg ${isSidebarOpen ? 'mr-3' : 'mr-0'} w-5 text-center`}></i>
    {isSidebarOpen && <span className="text-sm">{label}</span>}
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPage, isOpen }) => {
  const { t } = useAppContext();

  // Sidebar is always rendered for md+ screens. Its open/collapsed state is controlled by 'isOpen'.
  // On smaller screens (<md), it's not rendered (handled by App.tsx).
  return (
    <aside 
      className={`fixed top-0 left-0 h-full bg-gradient-to-b from-secondary to-primary text-white 
                 p-4 flex-col z-40 transition-all duration-300 ease-in-out hidden md:flex
                 ${isOpen ? 'w-64' : 'w-20'} 
                 shadow-xl`} // shadow always on desktop
    >
      <div className={`flex items-center shrink-0 mb-6 h-12 ${isOpen ? 'justify-start' : 'justify-center'}`}>
         <Logo className={`h-8 w-8 text-white ${isOpen ? 'mr-2.5' : 'mr-0'}`} isSidebarOpen={isOpen} />
        {isOpen && <h1 className="text-xl font-bold text-white truncate">{t('appName')}</h1>}
      </div>

      {/* Settings NavLink - Moved to top corner */}
      <div className="mb-2">
        <NavLink
          onClick={() => onNavigate('settings')}
          iconClass="fas fa-cog"
          label={t('navbar.settings')}
          isActive={currentPage === 'settings'}
          isSidebarOpen={isOpen}
        />
      </div>

      <nav className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2"> 
        <NavLink
          onClick={() => onNavigate('dashboard')}
          iconClass="fas fa-home"
          label={t('navbar.dashboard')}
          isActive={currentPage === 'dashboard'}
          isSidebarOpen={isOpen}
        />
        <NavLink
          onClick={() => onNavigate('transactions')}
          iconClass="fas fa-exchange-alt" 
          label={t('navbar.transactions')}
          isActive={currentPage === 'transactions'}
          isSidebarOpen={isOpen}
        />
        <NavLink
          onClick={() => onNavigate('recurring')}
          iconClass="fas fa-sync-alt" 
          label={t('navbar.recurring', {defaultValue: "Recurring"})}
          isActive={currentPage === 'recurring'}
          isSidebarOpen={isOpen}
        />
        <NavLink
          onClick={() => onNavigate('billScan')}
          iconClass="fas fa-camera" 
          label={t('navbar.billScan', {defaultValue: "Scan Bill"})}
          isActive={currentPage === 'billScan'}
          isSidebarOpen={isOpen}
        />
        <NavLink
          onClick={() => onNavigate('reports')}
          iconClass="fas fa-chart-pie" 
          label={t('navbar.reports')}
          isActive={currentPage === 'reports'}
          isSidebarOpen={isOpen}
        />
        {/* Settings NavLink was removed from here */}
      </nav>

      <div className="mt-auto shrink-0">
        <NavLink
            onClick={() => onNavigate('help')}
            iconClass="fas fa-question-circle"
            label={t('sidebar.helpCenter', {defaultValue: "Help Center"})}
            isActive={currentPage === 'help'}
            isSidebarOpen={isOpen}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
