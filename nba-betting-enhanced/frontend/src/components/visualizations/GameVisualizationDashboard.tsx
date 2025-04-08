import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface GameVisualizationDashboardProps {
  gameId: string;
  homeTeam: {
    id: string;
    name: string;
    score: number;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
    logo?: string;
  };
  status: string;
  quarter: number;
  timeRemaining: string;
}

const GameVisualizationDashboard: React.FC<GameVisualizationDashboardProps> = ({
  gameId,
  homeTeam,
  awayTeam,
  status,
  quarter,
  timeRemaining
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Tab options
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'shotchart', label: 'Shot Chart' },
    { id: 'players', label: 'Player Stats' },
    { id: 'momentum', label: 'Momentum' }
  ];

  return (
    <div className="bg-betting-dark rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-primary">
        <h2 className="font-bold text-xl text-white">Game Visualizations</h2>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="text-center p-4">
            <div className="flex justify-center items-center mb-4">
              <div className="flex flex-col items-center mx-4">
                <div className="w-16 h-16 bg-betting-highlight rounded-full flex items-center justify-center mb-2">
                  {homeTeam.logo ? (
                    <img 
                      src={homeTeam.logo} 
                      alt={`${homeTeam.name} logo`} 
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{homeTeam.name.charAt(0)}</div>
                  )}
                </div>
                <p className="text-sm text-white">{homeTeam.name}</p>
              </div>
              
              <div className="text-center mx-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {homeTeam.score} - {awayTeam.score}
                </div>
                <p className="text-sm text-gray-400">
                  {status === 'In Progress' ? `Q${quarter} - ${timeRemaining}` : status}
                </p>
              </div>
              
              <div className="flex flex-col items-center mx-4">
                <div className="w-16 h-16 bg-betting-highlight rounded-full flex items-center justify-center mb-2">
                  {awayTeam.logo ? (
                    <img 
                      src={awayTeam.logo} 
                      alt={`${awayTeam.name} logo`} 
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{awayTeam.name.charAt(0)}</div>
                  )}
                </div>
                <p className="text-sm text-white">{awayTeam.name}</p>
              </div>
            </div>
            
            <p className="text-gray-400 mt-4">
              Select a visualization tab to view detailed game analytics
            </p>
          </div>
        )}
        
        {activeTab === 'shotchart' && (
          <div className="text-center p-4">
            <div className="bg-betting-highlight rounded-lg p-6 flex items-center justify-center">
              <p className="text-white">Shot chart visualization will appear here</p>
            </div>
          </div>
        )}
        
        {activeTab === 'players' && (
          <div className="text-center p-4">
            <div className="bg-betting-highlight rounded-lg p-6 flex items-center justify-center">
              <p className="text-white">Player statistics comparison will appear here</p>
            </div>
          </div>
        )}
        
        {activeTab === 'momentum' && (
          <div className="text-center p-4">
            <div className="bg-betting-highlight rounded-lg p-6 flex items-center justify-center">
              <p className="text-white">Momentum chart will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameVisualizationDashboard;
