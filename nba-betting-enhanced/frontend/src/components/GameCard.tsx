import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  // State for flipping the card
  const [isFlipped, setIsFlipped] = useState(false);
  
  // State for score animation
  const [prevHomeScore, setPrevHomeScore] = useState(homeTeam.score);
  const [prevAwayScore, setPrevAwayScore] = useState(awayTeam.score);
  const [homeScoreChanged, setHomeScoreChanged] = useState(false);
  const [awayScoreChanged, setAwayScoreChanged] = useState(false);
  
  // Ref for the card element
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Check if game is live
  const isLive = status === 'live' || status === 'in progress';
  
  // Determine winning team
  const homeTeamWinning = homeTeam.score > awayTeam.score;
  const awayTeamWinning = awayTeam.score > homeTeam.score;
  const isTied = homeTeam.score === awayTeam.score;
  
  // Calculate score difference percentage for the score bar
  const totalScore = homeTeam.score + awayTeam.score;
  const homeScorePercentage = totalScore > 0 ? (homeTeam.score / totalScore) * 100 : 50;
  
  // Handle card flip
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  // Animate score changes
  useEffect(() => {
    if (homeTeam.score !== prevHomeScore) {
      setHomeScoreChanged(true);
      setTimeout(() => setHomeScoreChanged(false), 2000);
      setPrevHomeScore(homeTeam.score);
    }
    
    if (awayTeam.score !== prevAwayScore) {
      setAwayScoreChanged(true);
      setTimeout(() => setAwayScoreChanged(false), 2000);
      setPrevAwayScore(awayTeam.score);
    }
  }, [homeTeam.score, awayTeam.score, prevHomeScore, prevAwayScore]);
  
  // Card variants for animation
  const cardVariants = {
    front: {
      rotateY: 0,
      transition: { duration: 0.5 }
    },
    back: {
      rotateY: 180,
      transition: { duration: 0.5 }
    }
  };
  
  // Score animation variants
  const scoreVariants = {
    highlight: {
      textShadow: [
        "0 0 5px rgba(255,255,255,0.5)",
        "0 0 20px rgba(255,255,255,0.8)",
        "0 0 5px rgba(255,255,255,0.5)"
      ],
      color: "#FFFFFF",
      transition: { 
        duration: 2,
        repeat: 0
      }
    },
    normal: {
      textShadow: "none",
      transition: { 
        duration: 0.5
      }
    }
  };

  return (
    <div className="perspective-1000 relative" style={{ perspective: "1000px" }}>
      <motion.div
        className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'pointer-events-none' : ''}`}
        variants={cardVariants}
        animate={isFlipped ? "back" : "front"}
        ref={cardRef}
      >
        {/* Front of card */}
        <motion.div 
          className={`game-card ${isLive ? 'game-card-live' : ''} backface-hidden`}
          style={{ 
            backfaceVisibility: "hidden",
            position: isFlipped ? "absolute" : "relative",
            width: "100%",
            height: "100%",
            zIndex: isFlipped ? 0 : 1
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Game status */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              {isLive && (
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-live opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-status-live"></span>
                </span>
              )}
              <span className="text-sm font-medium text-gray-400">
                {isLive ? `Q${quarter} - ${timeRemaining}` : status}
              </span>
            </div>
            
            <motion.button
              className="text-gray-400 hover:text-white p-1 rounded-full focus:outline-none"
              onClick={handleFlip}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.button>
          </div>
          
          {/* Teams and scores */}
          <div className="flex justify-between items-center mb-4">
            {/* Home team */}
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden mr-3">
                <img 
                  src={homeTeam.logo || `https://via.placeholder.com/96?text=${homeTeam.name.substring(0, 2) }`} 
                  alt={`${homeTeam.name} logo`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://via.placeholder.com/96?text=${homeTeam.name.substring(0, 2) }`;
                  }}
                />
              </div>
              <div>
                <div className="font-bold text-lg">{homeTeam.name}</div>
                <div className="text-sm text-gray-400">{homeTeam.city || "Home"}</div>
              </div>
            </div>
            
            {/* Score */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <motion.div 
                  className={`text-2xl font-bold ${homeTeamWinning ? 'text-status-win' : ''}`}
                  variants={scoreVariants}
                  animate={homeScoreChanged ? "highlight" : "normal"}
                >
                  {homeTeam.score}
                </motion.div>
                <span className="text-gray-400">-</span>
                <motion.div 
                  className={`text-2xl font-bold ${awayTeamWinning ? 'text-status-win' : ''}`}
                  variants={scoreVariants}
                  animate={awayScoreChanged ? "highlight" : "normal"}
                >
                  {awayTeam.score}
                </motion.div>
              </div>
              {isLive && (
                <div className="text-xs text-gray-400 mt-1">Live</div>
              )}
            </div>
            
            {/* Away team */}
            <div className="flex items-center">
              <div>
                <div className="font-bold text-lg text-right">{awayTeam.name}</div>
                <div className="text-sm text-gray-400 text-right">{awayTeam.city || "Away"}</div>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden ml-3">
                <img 
                  src={awayTeam.logo || `https://via.placeholder.com/96?text=${awayTeam.name.substring(0, 2) }`} 
                  alt={`${awayTeam.name} logo`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://via.placeholder.com/96?text=${awayTeam.name.substring(0, 2) }`;
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Score comparison bar */}
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: "50%" }}
              animate={{ width: `${homeScorePercentage}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
          
          {/* Odds and predictions */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-betting-highlight p-2 rounded-md">
              <div className="text-xs text-gray-400 mb-1">Spread</div>
              <div className="text-sm font-medium">
                {odds.spread > 0 ? `+${odds.spread}` : odds.spread}
              </div>
            </div>
            <div className="bg-betting-highlight p-2 rounded-md">
              <div className="text-xs text-gray-400 mb-1">Total</div>
              <div className="text-sm font-medium">
                O/U {odds.total}
              </div>
            </div>
          </div>
          
          {/* Win probability chart */}
          <div className="mb-4 h-24">
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
            <motion.button 
              className="btn btn-outline text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorite
            </motion.button>
            <motion.button 
              className="btn btn-primary text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </motion.button>
          </div>
        </motion.div>
        
        {/* Back of card */}
        <motion.div 
          className="game-card backface-hidden"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg) ",
            position: isFlipped ? "relative" : "absolute",
            width: "100%",
            height: "100%",
            zIndex: isFlipped ? 1 : 0
          }}
        >
          {/* Card header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Game Details</h3>
            <motion.button
              className="text-gray-400 hover:text-white p-1 rounded-full focus:outline-none"
              onClick={handleFlip}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
          
          {/* Game info */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-1">Game ID</div>
            <div className="text-md font-medium">{id}</div>
          </div>
          
          {/* Team stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="col-span-1 text-center">
              <div className="text-sm text-gray-400 mb-1">{homeTeam.name}</div>
              <div className="text-lg font-bold">{homeTeam.score}</div>
            </div>
            
            <div className="col-span-1 text-center">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-md font-medium">
                {isLive ? (
                  <span className="text-status-live">Live Q{quarter}</span>
                )  : (
                  <span>{status}</span>
                )}
              </div>
            </div>
            
            <div className="col-span-1 text-center">
              <div className="text-sm text-gray-400 mb-1">{awayTeam.name}</div>
              <div className="text-lg font-bold">{awayTeam.score}</div>
            </div>
          </div>
          
          {/* Predictions */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Win Probability</div>
            <div className="flex items-center mb-1">
              <div className="w-24 text-sm">{homeTeam.name}</div>
              <div className="flex-1 mx-2">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${predictions.homeWinProbability * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                </div>
              </div>
              <div className="w-12 text-right text-sm">{Math.round(predictions.homeWinProbability * 100)}%</div>
            </div>
            
            <div className="flex items-center">
              <div className="w-24 text-sm">{awayTeam.name}</div>
              <div className="flex-1 mx-2">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-secondary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${predictions.awayWinProbability * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                </div>
              </div>
              <div className="w-12 text-right text-sm">{Math.round(predictions.awayWinProbability * 100)}%</div>
            </div>
          </div>
          
          {/* Betting odds */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Betting Odds</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-betting-highlight p-2 rounded-md">
                <div className="text-xs text-gray-400 mb-1">Spread</div>
                <div className="text-sm font-medium">
                  {homeTeam.name} {odds.spread > 0 ? `+${odds.spread}` : odds.spread}
                </div>
              </div>
              <div className="bg-betting-highlight p-2 rounded-md">
                <div className="text-xs text-gray-400 mb-1">Total</div>
                <div className="text-sm font-medium">
                  Over/Under {odds.total}
                </div>
              </div>
            </div>
          </div>
          
          {/* Predicted final score */}
          {(predictions.predictedHomeScore && predictions.predictedAwayScore) && (
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">Predicted Final Score</div>
              <div className="bg-betting-highlight p-3 rounded-md text-center">
                <div className="flex justify-center items-center">
                  <span className="font-bold">{homeTeam.name}</span>
                  <span className="mx-2 text-lg font-bold">{predictions.predictedHomeScore}</span>
                  <span className="text-gray-400 mx-1">-</span>
                  <span className="mx-2 text-lg font-bold">{predictions.predictedAwayScore}</span>
                  <span className="font-bold">{awayTeam.name}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="relative z-10 px-4 pb-4 pt-2 border-t border-gray-700 flex justify-between">
            <motion.button 
              className="btn btn-outline text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Stats
            </motion.button>
            <motion.button 
              className="btn btn-primary text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Place Bet
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  ) ;
};

export default GameCard;
