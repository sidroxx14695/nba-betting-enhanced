import React from 'react';
import WinProbabilityChart from '../visualizations/WinProbabilityChart'; // Corrected the path

interface TeamInfo {
  id: string;
  name: string;
  city: string;
  logo: string;
  score: number;
}

interface GameProps {
  id: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: string;
  quarter: number;
  timeRemaining: string;
  odds: {
    spread: number;
    total: number;
  };
  predictions: {
    homeWinProbability: number;
    awayWinProbability: number;
    predictedHomeScore?: number;
    predictedAwayScore?: number;
  };
}

const GameCard: React.FC<GameProps> = ({
  id,
  homeTeam,
  awayTeam,
  status,
  quarter,
  timeRemaining,
  odds,
  predictions
}) => {
  // Format the spread with + sign for positive values
  const formattedSpread = odds.spread > 0 ? `+${odds.spread}` : odds.spread;
  
  // Determine status display text
  const statusText = status === 'In Progress' 
    ? `Q${quarter} ${timeRemaining}` 
    : status;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Game Header - Status and Odds */}
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex justify-between items-center">
        <span className="font-medium text-gray-700 dark:text-gray-300">{statusText}</span>
        <div className="flex space-x-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Spread: {formattedSpread}</span>
          <span className="text-gray-600 dark:text-gray-400">O/U: {odds.total}</span>
        </div>
      </div>
      
      {/* Teams Section */}
      <div className="p-4">
        {/* Home Team */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 mr-3 flex-shrink-0">
              <img 
                src={homeTeam.logo} 
                alt={`${homeTeam.name} logo`} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                }}
              />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{homeTeam.city}</p>
              <p className="text-gray-700 dark:text-gray-300">{homeTeam.name}</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{homeTeam.score}</div>
        </div>
        
        {/* Away Team */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 mr-3 flex-shrink-0">
              <img 
                src={awayTeam.logo} 
                alt={`${awayTeam.name} logo`} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                }}
              />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{awayTeam.city}</p>
              <p className="text-gray-700 dark:text-gray-300">{awayTeam.name}</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{awayTeam.score}</div>
        </div>
      </div>
      
      {/* Win Probability Chart */}
      <div className="px-4 pb-4">
        <WinProbabilityChart 
          gameId={id}
          homeTeam={homeTeam.name}
          awayTeam={awayTeam.name}
          homeWinProbability={predictions.homeWinProbability}
          awayWinProbability={predictions.awayWinProbability}
          homeColor="#1E40AF" // Default blue
          awayColor="#DC2626" // Default red
        />
      </div>
    </div>
  );
};

export default GameCard;
