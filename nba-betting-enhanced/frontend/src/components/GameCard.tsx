import React from 'react';
import { motion } from 'framer-motion';
import WinProbabilityChart from "./visualizations/WinProbabilityChart";

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
    
  // Determine if game is live
  const isLive = status === 'In Progress';
  
  // Determine team colors (using our theme colors for now)
  const homeTeamColor = 'team-lakers'; // This would ideally be dynamically assigned based on team
  const awayTeamColor = 'team-heat';   // This would ideally be dynamically assigned based on team
  
  // Determine which team is winning
  const homeTeamWinning = homeTeam.score > awayTeam.score;
  const awayTeamWinning = awayTeam.score > homeTeam.score;
  const isTied = homeTeam.score === awayTeam.score;

  return (
    <motion.div 
      className={`card overflow-hidden relative ${isLive ? 'game-card-live' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
    >
      {/* Background gradient based on team colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-betting-card to-betting-highlight opacity-80 z-0"></div>
      
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 z-10">
          <div className="badge-live flex items-center">
            <span className="relative flex h-3 w-3 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-live opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-status-live"></span>
            </span>
            LIVE
          </div>
        </div>
      )}
      
      {/* Game Header - Status and Odds */}
      <div className="relative z-10 px-4 py-3 flex justify-between items-center border-b border-gray-700">
        <span className="font-medium text-white">{statusText}</span>
        <div className="flex space-x-4 text-sm">
          <span className="text-gray-300">Spread: {formattedSpread}</span>
          <span className="text-gray-300">O/U: {odds.total}</span>
        </div>
      </div>
      
      {/* Teams Section */}
      <div className="relative z-10 p-4">
        {/* Home Team */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 mr-4 flex-shrink-0 bg-betting-highlight rounded-full p-1 shadow-lg">
              <img 
                src={homeTeam.logo} 
                alt={`${homeTeam.name} logo`} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{homeTeam.city}</p>
              <p className="text-gray-300">{homeTeam.name}</p>
              {predictions.predictedHomeScore && (
                <p className="text-xs text-gray-400 mt-1">Predicted: {predictions.predictedHomeScore} pts</p>
              ) }
            </div>
          </div>
          <div className={`text-3xl font-bold ${homeTeamWinning ? 'text-status-win' : 'text-white'}`}>
            {homeTeam.score}
          </div>
        </div>
        
        {/* Score comparison bar */}
        <div className="h-2 bg-gray-700 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-light"
            style={{ 
              width: `${(homeTeam.score / (homeTeam.score + awayTeam.score || 1)) * 100}%`,
              transition: 'width 1s ease-in-out'
            }}
          ></div>
        </div>
        
        {/* Away Team */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-16 h-16 mr-4 flex-shrink-0 bg-betting-highlight rounded-full p-1 shadow-lg">
              <img 
                src={awayTeam.logo} 
                alt={`${awayTeam.name} logo`} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{awayTeam.city}</p>
              <p className="text-gray-300">{awayTeam.name}</p>
              {predictions.predictedAwayScore && (
                <p className="text-xs text-gray-400 mt-1">Predicted: {predictions.predictedAwayScore} pts</p>
              ) }
            </div>
          </div>
          <div className={`text-3xl font-bold ${awayTeamWinning ? 'text-status-win' : 'text-white'}`}>
            {awayTeam.score}
          </div>
        </div>
      </div>
      
      {/* Win Probability Chart */}
      <div className="relative z-10 px-4 pb-4">
        <WinProbabilityChart 
          gameId={id}
          homeTeam={homeTeam.name}
          awayTeam={awayTeam.name}
          homeWinProbability={predictions.homeWinProbability}
          awayWinProbability={predictions.awayWinProbability}
          homeColor="#1E40AF" // Using primary color
          awayColor="#D97706" // Using secondary color
        />
      </div>
      
      {/* Game actions */}
      <div className="relative z-10 px-4 pb-4 pt-2 border-t border-gray-700 flex justify-between">
        <button className="btn btn-outline text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Favorite
        </button>
        <button className="btn btn-primary text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
      </div>
    </motion.div>
  ) ;
};

export default GameCard;
