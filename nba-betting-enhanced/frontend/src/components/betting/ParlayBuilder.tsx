import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for parlay builder
interface Game {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    logo?: string;
  };
  status: string;
  startTime: string;
  odds: {
    homeMoneyline: number;
    awayMoneyline: number;
    spread: number;
    spreadHome: number;
    spreadAway: number;
    total: number;
    overOdds: number;
    underOdds: number;
  };
}

interface BetSelection {
  id: string;
  gameId: string;
  betType: 'moneyline' | 'spread' | 'total';
  selection: string;
  odds: number;
  details: string;
}

interface ParlayBuilderProps {
  availableGames: Game[];
  onAddToBetSlip: (selections: BetSelection[]) => void;
}

const ParlayBuilder: React.FC<ParlayBuilderProps> = ({
  availableGames,
  onAddToBetSlip
}) => {
  // State for selected bets
  const [selectedBets, setSelectedBets] = useState<BetSelection[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'live' | 'all'>('upcoming');
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  
  // Filter games based on active tab
  const filteredGames = availableGames.filter(game => {
    if (activeTab === 'upcoming') return game.status === 'scheduled';
    if (activeTab === 'live') return game.status === 'live' || game.status === 'in progress';
    return true;
  });
  
  // Toggle expanded game
  const toggleExpandGame = (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId(null);
    } else {
      setExpandedGameId(gameId);
    }
  };
  
  // Handle bet selection
  const handleBetSelection = (bet: BetSelection) => {
    // Check if this bet is already selected
    const existingIndex = selectedBets.findIndex(
      selected => selected.gameId === bet.gameId && selected.betType === bet.betType
    );
    
    if (existingIndex >= 0) {
      // If same exact bet, remove it
      if (selectedBets[existingIndex].selection === bet.selection) {
        setSelectedBets(selectedBets.filter((_, index) => index !== existingIndex));
      } 
      // If different selection for same bet type, replace it
      else {
        const newSelectedBets = [...selectedBets];
        newSelectedBets[existingIndex] = bet;
        setSelectedBets(newSelectedBets);
      }
    } else {
      // Add new bet
      setSelectedBets([...selectedBets, bet]);
    }
  };
  
  // Check if a bet is selected
  const isBetSelected = (gameId: string, betType: string, selection: string) => {
    return selectedBets.some(
      bet => bet.gameId === gameId && bet.betType === betType && bet.selection === selection
    );
  };
  
  // Add selections to bet slip
  const addToBetSlip = () => {
    if (selectedBets.length > 0) {
      onAddToBetSlip(selectedBets);
      setSelectedBets([]);
    }
  };
  
  // Format odds (American format)
  const formatOdds = (odds: number) => {
    return odds >= 0 ? `+${odds}` : `${odds}`;
  };
  
  // Get game time display
  const getGameTimeDisplay = (game: Game) => {
    if (game.status === 'live' || game.status === 'in progress') {
      return <span className="text-status-live">Live</span>;
    }
    
    const gameDate = new Date(game.startTime);
    return gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const expandVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };
  
  const selectionVariants = {
    unselected: { 
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      scale: 1
    },
    selected: { 
      backgroundColor: 'rgba(30, 64, 175, 0.3)',
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    hover: {
      backgroundColor: 'rgba(30, 41, 59, 0.8)',
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      className="bg-betting-card rounded-lg shadow-lg overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="p-4 bg-primary">
        <h3 className="font-bold text-lg">Parlay Builder</h3>
        <p className="text-sm text-gray-200">Select multiple bets to create a parlay</p>
      </div>
      
      {/* Filter tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === 'upcoming' 
              ? 'border-b-2 border-primary text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === 'live' 
              ? 'border-b-2 border-primary text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('live')}
        >
          Live
        </button>
        <button
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === 'all' 
              ? 'border-b-2 border-primary text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Games
        </button>
      </div>
      
      {/* Games list */}
      <div className="divide-y divide-gray-700 max-h-[60vh] overflow-y-auto">
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <motion.div
              key={game.id}
              className="p-4"
              variants={itemVariants}
            >
              {/* Game header */}
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpandGame(game.id)}
              >
                <div>
                  <div className="text-sm text-gray-400">
                    {getGameTimeDisplay(game)}
                  </div>
                  <div className="font-medium mt-1">
                    {game.homeTeam.name} vs {game.awayTeam.name}
                  </div>
                </div>
                
                <motion.div
                  animate={{ rotate: expandedGameId === game.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              
              {/* Expanded bet options */}
              <AnimatePresence>
                {expandedGameId === game.id && (
                  <motion.div
                    className="mt-4 grid grid-cols-1 gap-4"
                    variants={expandVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    {/* Moneyline */}
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Moneyline</div>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.div
                          className="p-3 rounded-md cursor-pointer"
                          variants={selectionVariants}
                          animate={isBetSelected(game.id, 'moneyline', game.homeTeam.name)  ? 'selected' : 'unselected'}
                          whileHover="hover"
                          onClick={() => handleBetSelection({
                            id: `${game.id}-ml-home`,
                            gameId: game.id,
                            betType: 'moneyline',
                            selection: game.homeTeam.name,
                            odds: game.odds.homeMoneyline,
                            details: `${game.homeTeam.name} to win`
                          })}
                        >
                          <div className="flex justify-between items-center">
                            <span>{game.homeTeam.name}</span>
                            <span className="font-bold">{formatOdds(game.odds.homeMoneyline)}</span>
                          </div>
                        </motion.div>
                        
                        <motion.div
                          className="p-3 rounded-md cursor-pointer"
                          variants={selectionVariants}
                          animate={isBetSelected(game.id, 'moneyline', game.awayTeam.name) ? 'selected' : 'unselected'}
                          whileHover="hover"
                          onClick={() => handleBetSelection({
                            id: `${game.id}-ml-away`,
                            gameId: game.id,
                            betType: 'moneyline',
                            selection: game.awayTeam.name,
                            odds: game.odds.awayMoneyline,
                            details: `${game.awayTeam.name} to win`
                          })}
                        >
                          <div className="flex justify-between items-center">
                            <span>{game.awayTeam.name}</span>
                            <span className="font-bold">{formatOdds(game.odds.awayMoneyline)}</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Spread */}
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Spread</div>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.div
                          className="p-3 rounded-md cursor-pointer"
                          variants={selectionVariants}
                          animate={isBetSelected(game.id, 'spread', `${game.homeTeam.name} ${formatOdds(game.odds.spread)}`) ? 'selected' : 'unselected'}
                          whileHover="hover"
                          onClick={() => handleBetSelection({
                            id: `${game.id}-spread-home`,
                            gameId: game.id,
                            betType: 'spread',
                            selection: `${game.homeTeam.name} ${formatOdds(game.odds.spread)}`,
                            odds: game.odds.spreadHome,
                            details: `${game.homeTeam.name} ${formatOdds(game.odds.spread)}`
                          })}
                        >
                          <div className="flex justify-between items-center">
                            <span>{game.homeTeam.name} {formatOdds(game.odds.spread)}</span>
                            <span className="font-bold">{formatOdds(game.odds.spreadHome)}</span>
                          </div>
                        </motion.div>
                        
                        <motion.div
                          className="p-3 rounded-md cursor-pointer"
                          variants={selectionVariants}
                          animate={isBetSelected(game.id, 'spread', `${game.awayTeam.name} ${game.odds.spread > 0 ? formatOdds(-game.odds.spread) : formatOdds(Math.abs(game.odds.spread))}`) ? 'selected' : 'unselected'}
                          whileHover="hover"
                          onClick={() => handleBetSelection({
                            id: `${game.id}-spread-away`,
                            gameId: game.id,
                            betType: 'spread',
                            selection: `${game.awayTeam.name} ${game.odds.spread > 0 ? formatOdds(-game.odds.spread) : formatOdds(Math.abs(game.odds.spread))}`,
                            odds: game.odds.spreadAway,
                            details: `${game.awayTeam.name} ${game.odds.spread > 0 ? formatOdds(-game.odds.spread) : formatOdds(Math.abs(game.odds.spread))}`
                          })}
                        >
                          <div className="flex justify-between items-center">
                            <span>{game.awayTeam.name} {game.odds.spread > 0 ? formatOdds(-game.odds.spread) : formatOdds(Math.abs(game.odds.spread))}</span>
                            <span className="font-bold">{formatOdds(game.odds.spreadAway)}</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Total */}
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Total</div>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.div
                          className="p-3 rounded-md cursor-pointer"
                          variants={selectionVariants}
                          animate={isBetSelected(game.id, 'total', `Over ${game.odds.total}`) ? 'selected' : 'unselected'}
                          whileHover="hover"
                          onClick={() => handleBetSelection({
                            id: `${game.id}-total-over`,
                            gameId: game.id,
                            betType: 'total',
                            selection: `Over ${game.odds.total}`,
                            odds: game.odds.overOdds,
                            details: `Over ${game.odds.total} points`
                          })}
                        >
                          <div className="flex justify-between items-center">
                            <span>Over {game.odds.total}</span>
                            <span className="font-bold">{formatOdds(game.odds.overOdds)}</span>
                          </div>
                        </motion.div>
                        
                        <motion.div
                          className="p-3 rounded-md cursor-pointer"
                          variants={selectionVariants}
                          animate={isBetSelected(game.id, 'total', `Under ${game.odds.total}`) ? 'selected' : 'unselected'}
                          whileHover="hover"
                          onClick={() => handleBetSelection({
                            id: `${game.id}-total-under`,
                            gameId: game.id,
                            betType: 'total',
                            selection: `Under ${game.odds.total}`,
                            odds: game.odds.underOdds,
                            details: `Under ${game.odds.total} points`
                          })}
                        >
                          <div className="flex justify-between items-center">
                            <span>Under {game.odds.total}</span>
                            <span className="font-bold">{formatOdds(game.odds.underOdds)}</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No games available</p>
            <p className="text-sm mt-2">
              {activeTab === 'upcoming' ? 'There are no upcoming games scheduled' : 
               activeTab === 'live' ? 'There are no live games at the moment' : 
               'There are no games available'}
            </p>
          </div>
        ) }
      </div>
      
      {/* Selected bets summary */}
      {selectedBets.length > 0 && (
        <div className="p-4 bg-betting-highlight border-t border-gray-700">
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Selected Bets ({selectedBets.length})</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedBets.map((bet) => (
                <div key={bet.id} className="flex justify-between items-center p-2 bg-betting-card rounded-md">
                  <div className="text-sm">
                    <div>{bet.details}</div>
                    <div className="text-xs text-gray-400">
                      {formatOdds(bet.odds)}
                    </div>
                  </div>
                  <motion.button
                    className="text-gray-400 hover:text-white p-1"
                    onClick={() => handleBetSelection(bet)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              ) )}
            </div>
          </div>
          
          <motion.button
            className="w-full btn btn-primary text-sm"
            onClick={addToBetSlip}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add to Bet Slip
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default ParlayBuilder;
