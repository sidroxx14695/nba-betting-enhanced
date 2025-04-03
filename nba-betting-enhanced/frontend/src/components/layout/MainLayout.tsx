import React, { useState } from 'react';
import Sidebar from './Sidebar/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} toggleCollapsed={toggleSidebar} />
      
      <main className={`flex-1 overflow-y-auto transition-all duration-300 bg-betting-dark`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
