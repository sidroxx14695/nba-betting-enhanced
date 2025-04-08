import React, { useState } from 'react';
import Sidebar from './Sidebar/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
      
      {/* Main content */}
      <div className={`flex-1 ${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;