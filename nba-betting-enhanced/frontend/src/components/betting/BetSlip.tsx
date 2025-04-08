import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for bet items
interface BetItem {
  id: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  betType: string;
  selection: string;
  odds: number;
  stake?: number;
  potentialWinnings?: number;
}

// Types for bet slip
interface BetSlipProps {
  initialBets?: BetItem[];
  onBetAdded?: (bet: BetItem) => void;
  onBetRemoved?: (betId: string) => void;
  onBetUpdated?: (bet: BetItem) => void;
  onPlaceBet?: (bets: BetItem[], totalStake: number, totalPotentialWinnings: number) => void;
}

const BetSlip: React.FC<BetSlipProps> = ({
  initialBets = [],
  onBetAdded,
  onBetRemoved,
  onBetUpdated,
  onPlaceBet
}) => {
  // State for bets
  const [bets, setBets] = useState<BetItem[]>(initialBets);
  const [betType, setBetType] = useState<'single' | 'parlay'>('single');
  const [totalStake, setTotalStake] = useState<number>(0);
  const [totalPotentialWinnings, setTotalPotentialWinnings] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedBet, setDraggedBet] = useState<BetItem | null>(null);
  
  // Calculate totals when bets change
  useEffect(() => {
    calculateTotals();
  }, [bets, betType]);
  
  // Calculate total stake and potential winnings
  const calculateTotals = () => {
    let stake = 0;
    let winnings = 0;
    
    if (betType === 'single') {
      // For single bets, sum up individual stakes and winnings
      bets.forEach(bet => {
        if (bet.stake) {
          stake += bet.stake;
          winnings += bet.potentialWinnings || 0;
        }
      });
    } else {
      // For parlay, calculate combined odds and apply single stake
      const parlayStake = bets.length > 0 ? (bets[0].stake || 0) : 0;
      stake = parlayStake;
      
      if (parlayStake > 0 && bets.length > 0) {
        let combinedOdds = 1;
        bets.forEach(bet => {
          // Convert American odds to decimal for calculation
          const decimalOdds = bet.odds > 0 
            ? (bet.odds / 100) + 1 
            : (100 / Math.abs(bet.odds)) + 1;
          combinedOdds *= decimalOdds;
        });
        
        winnings = parlayStake * combinedOdds;
      }
    }
    
    setTotalStake(stake);
    setTotalPotentialWinnings(winnings);
  };
  
  // Add a bet to the slip
  const addBet = (bet: BetItem) => {
    // Check if bet already exists
    const existingBetIndex = bets.findIndex(b => b.id === bet.id);
    
    if (existingBetIndex === -1) {
      const newBet = {
        ...bet,
        stake: 10, // Default stake
        potentialWinnings: calculatePotentialWinnings(bet.odds, 10)
      };
      
      const newBets = [...bets, newBet];
      setBets(newBets);
      
      if (onBetAdded) {
        onBetAdded(newBet);
      }
    }
  };
  
  // Remove a bet from the slip
  const removeBet = (betId: string) => {
    const newBets = bets.filter(bet => bet.id !== betId);
    setBets(newBets);
    
    if (onBetRemoved) {
      onBetRemoved(betId);
    }
  };
  
  // Update a bet in the slip
  const updateBet = (betId: string, stake: number) => {
    const newBets = bets.map(bet => {
      if (bet.id === betId) {
        const potentialWinnings = calculatePotentialWinnings(bet.odds, stake);
        const updatedBet = { ...bet, stake, potentialWinnings };
        
        if (onBetUpdated) {
          onBetUpdated(updatedBet);
        }
        
        return updatedBet;
      }
      
      // For parlay, update all stakes to match
      if (betType === 'parlay') {
        return { ...bet, stake };
      }
      
      return bet;
    });
    
    setBets(newBets);
  };
  
  // Calculate potential winnings based on odds and stake
  const calculatePotentialWinnings = (odds: number, stake: number): number => {
    if (odds > 0) {
      return (odds / 100) * stake;
    } else {
      return (100 / Math.abs(odds)) * stake;
    }
  };
  
  // Handle bet type change
  const handleBetTypeChange = (type: 'single' | 'parlay') => {
    setBetType(type);
    
    // If switching to parlay, set all stakes to the same value
    if (type === 'parlay' && bets.length > 0) {
      const parlayStake = bets[0].stake || 10;
      const newBets = bets.map(bet => ({
        ...bet,
        stake: parlayStake
      }));
      setBets(newBets);
    }
  };
  
  // Handle stake change
  const handleStakeChange = (betId: string, value: string) => {
    const stake = parseFloat(value) || 0;
    
    if (betType === 'parlay') {
      // Update all bets with the same stake for parlay
      bets.forEach(bet => {
        updateBet(bet.id, stake);
      });
    } else {
      // Update only the specific bet for singles
      updateBet(betId, stake);
    }
  };
  
  // Handle place bet
  const handlePlaceBet = () => {
    if (onPlaceBet) {
      onPlaceBet(bets, totalStake, totalPotentialWinnings);
    }
    
    // Clear the bet slip after placing bet
    setBets([]);
  };
  
  // Drag and drop handlers
  const handleDragStart = (bet: BetItem) => {
    setIsDragging(true);
    setDraggedBet(bet);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedBet(null);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedBet) return;
    
    const draggedIndex = bets.findIndex(bet => bet.id === draggedBet.id);
    if (draggedIndex === index) return;
    
    // Reorder the bets
    const newBets = [...bets];
    newBets.splice(draggedIndex, 1);
    newBets.splice(index, 0, draggedBet);
    setBets(newBets);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Format odds (American format)
  const formatOdds = (odds: number) => {
    return odds >= 0 ? `+${odds}` : `${odds}`;
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    minimized: {
      height: 60,
      transition: { duration: 0.3 }
    },
    expanded: {
      height: 'auto',
      transition: { duration: 0.3 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 }
    }
  };
  
  const emptyVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className="fixed bottom-0 right-0 w-full md:w-96 bg-betting-card rounded-t-lg shadow-xl z-50"
      variants={containerVariants}
      initial="hidden"
      animate={isMinimized ? "minimized" : "expanded"}
      style={{ maxHeight: isMinimized ? '60px' : '80vh', overflow: 'hidden' }}
    >
      {/* Header */}
      <div 
        className="p-4 bg-primary flex justify-between items-center cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="font-bold">Bet Slip {bets.length > 0 && `(${bets.length}) `}</h3>
        </div>
        <motion.div
          animate={{ rotate: isMinimized ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>
      
      {/* Bet type selector */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex rounded-md overflow-hidden">
          <button
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              betType === 'single' 
                ? 'bg-primary text-white' 
                : 'bg-betting-highlight text-gray-400 hover:text-white'
            }`}
            onClick={()  => handleBetTypeChange('single')}
          >
            Singles
          </button>
          <button
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              betType === 'parlay' 
                ? 'bg-primary text-white' 
                : 'bg-betting-highlight text-gray-400 hover:text-white'
            }`}
            onClick={() => handleBetTypeChange('parlay')}
            disabled={bets.length < 2}
          >
            Parlay
          </button>
        </div>
      </div>
      
      {/* Bet list */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
        {bets.length > 0 ? (
          <AnimatePresence>
            {bets.map((bet, index) => (
              <motion.div
                key={bet.id}
                className={`p-4 border-b border-gray-700 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                draggable
                onDragStart={() => handleDragStart(bet)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{bet.homeTeam} vs {bet.awayTeam}</div>
                    <div className="text-sm text-gray-400">
                      {bet.betType}: <span className="text-primary-light">{bet.selection}</span>
                    </div>
                  </div>
                  <motion.button
                    className="text-gray-400 hover:text-white p-1"
                    onClick={() => removeBet(bet.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-gray-400">Odds: </span>
                    <span className="font-medium">{formatOdds(bet.odds) }</span>
                  </div>
                  
                  {betType === 'single' || (betType === 'parlay' && index === 0) ? (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 mr-2">Stake:</span>
                      <input
                        type="number"
                        className="w-20 bg-betting-highlight border border-gray-700 rounded px-2 py-1 text-right text-sm"
                        value={bet.stake || ''}
                        onChange={(e) => handleStakeChange(bet.id, e.target.value)}
                        min="1"
                        step="1"
                      />
                    </div>
                  ) : null}
                </div>
                
                {betType === 'single' && bet.stake && bet.stake > 0 && (
                  <div className="mt-2 text-right text-sm">
                    <span className="text-gray-400">Potential win: </span>
                    <span className="font-medium text-status-win">
                      {formatCurrency(bet.potentialWinnings || 0)}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div
            className="p-8 text-center text-gray-400"
            variants={emptyVariants}
            initial="hidden"
            animate="visible"
          >
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>Your bet slip is empty</p>
            <p className="text-sm mt-2">Add selections to start building your bet</p>
          </motion.div>
        ) }
      </div>
      
      {/* Totals and action buttons */}
      {bets.length > 0 && (
        <div className="p-4 bg-betting-highlight border-t border-gray-700">
          {/* Parlay details */}
          {betType === 'parlay' && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-400">Combined Odds</div>
                <div className="font-bold">
                  {formatOdds(Math.round(
                    bets.reduce((acc, bet) => {
                      const decimalOdds = bet.odds > 0 
                        ? (bet.odds / 100) + 1 
                        : (100 / Math.abs(bet.odds)) + 1;
                      return acc * decimalOdds;
                    }, 1) * 100 - 100
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">Potential Win</div>
                <div className="font-bold text-status-win">
                  {formatCurrency(totalPotentialWinnings)}
                </div>
              </div>
            </div>
          )}
          
          {/* Totals */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-400">Total Stake</div>
            <div className="font-bold">{formatCurrency(totalStake)}</div>
          </div>
          
          {betType === 'single' && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-400">Total Potential Win</div>
              <div className="font-bold text-status-win">
                {formatCurrency(totalPotentialWinnings)}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex space-x-2">
            <motion.button
              className="flex-1 btn btn-outline text-sm"
              onClick={() => setBets([])}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Clear All
            </motion.button>
            <motion.button
              className="flex-1 btn btn-primary text-sm"
              onClick={handlePlaceBet}
              disabled={totalStake <= 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Place Bet
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BetSlip;
