import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SidebarProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleCollapsed }) => {
  const location = useLocation();
  const [liveGames, setLiveGames] = useState([
    { id: '1', homeTeam: 'LAL', awayTeam: 'GSW', score: '87-82' },
    { id: '2', homeTeam: 'BOS', awayTeam: 'MIA', score: '92-88' },
  ]);

  // Navigation items
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )  
    },
    { 
      path: '/favorites', 
      label: 'Favorites', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )  
    },
    { 
      path: '/history', 
      label: 'Betting History', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )  
    },
    { 
      path: '/risk-assessment', 
      label: 'Risk Profile', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )  
    },
  ];

  return (
    <motion.div 
      className={`h-screen bg-betting-card border-r border-gray-700 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
    >
      {/* User profile section */}
      <div className={`p-4 border-b border-gray-700 ${collapsed ? 'items-center' : ''}`}>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">U</span>
          </div>
          
          {!collapsed && (
            <div className="ml-3">
              <p className="text-white font-medium">Username</p>
              <p className="text-xs text-gray-400">$1,250.00</p>
            </div>
          )}
          
          <button 
            onClick={toggleCollapsed}
            className={`ml-auto text-gray-400 hover:text-white ${collapsed ? 'mx-auto mt-4' : ''}`}
          >
            {collapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )  : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) }
          </button>
        </div>
      </div>
      
      {/* Navigation section */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 text-gray-300 hover:bg-betting-highlight hover:text-white transition-colors ${
                  location.pathname === item.path ? 'bg-betting-highlight text-white border-l-4 border-primary' : ''
                }`}
              >
                <span className="inline-flex">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Live games section */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-live opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-status-live"></span>
            </span>
            LIVE GAMES
          </h3>
          
          <ul className="space-y-2">
            {liveGames.map((game) => (
              <li key={game.id}>
                <Link
                  to={`/games/${game.id}`}
                  className="block p-2 rounded-md hover:bg-betting-highlight transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{game.homeTeam} vs {game.awayTeam}</span>
                    <span className="text-sm text-gray-400">{game.score}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;
