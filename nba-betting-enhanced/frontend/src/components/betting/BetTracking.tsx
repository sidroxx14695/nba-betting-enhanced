import React, { useState, useEffect } from 'react';
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
  status?: 'pending' | 'won' | 'lost' | 'cashout';
  liveOdds?: number;
  oddsChange?: 'up' | 'down' | 'none';
}

// Types for bet tracking
interface BetTrackingProps {
  bets: BetItem[];
  onCashout?: (betId: string) => void;
}

const BetTracking: React.FC<BetTrackingProps> = ({
  bets,
  onCashout
}) => {
  // State for filtering
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);
  
  // Filter bets based on selected filter
  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    if (filter === 'pending') return bet.status === 'pending';
    if (filter === 'settled') return bet.status === 'won' || bet.status === 'lost';
    return true;
  });
  
  // Toggle expanded bet
  const toggleExpandBet = (betId: string) => {
    if (expandedBetId === betId) {
      setExpandedBetId(null);
    } else {
      setExpandedBetId(betId);
    }
  };
  
  // Handle cashout
  const handleCashout = (betId: string) => {
    if (onCashout) {
      onCashout(betId);
    }
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
  
  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'won':
        return 'text-status-win';
      case 'lost':
        return 'text-status-loss';
      case 'cashout':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };
  
  // Get status text
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'won':
        return 'Won';
      case 'lost':
        return 'Lost';
      case 'cashout':
        return 'Cashed Out';
      default:
        return 'Pending';
    }
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

  return (
    <motion.div
      className="bg-betting-card rounded-lg shadow-lg overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="p-4 bg-primary">
        <h3 className="font-bold text-lg">Bet Tracking</h3>
      </div>
      
      {/* Filter tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'border-b-2 border-primary text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setFilter('all')}
        >
          All Bets
        </button>
        <button
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            filter === 'pending' 
              ? 'border-b-2 border-primary text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            filter === 'settled' 
              ? 'border-b-2 border-primary text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setFilter('settled')}
        >
          Settled
        </button>
      </div>
      
      {/* Bet list */}
      <div className="divide-y divide-gray-700">
        {filteredBets.length > 0 ? (
          filteredBets.map((bet) => (
            <motion.div
              key={bet.id}
              className="p-4"
              variants={itemVariants}
            >
              {/* Bet header */}
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpandBet(bet.id)}
              >
                <div>
                  <div className="font-medium">{bet.homeTeam} vs {bet.awayTeam}</div>
                  <div className="text-sm text-gray-400">
                    {bet.betType}: <span className="text-primary-light">{bet.selection}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-medium ${getStatusColor(bet.status)}`}>
                    {getStatusText(bet.status)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatCurrency(bet.stake || 0)}
                  </div>
                </div>
              </div>
              
              {/* Expanded bet details */}
              <AnimatePresence>
                {expandedBetId === bet.id && (
                  <motion.div
                    className="mt-4 pt-4 border-t border-gray-700"
                    variants={expandVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Placed</div>
                        <div className="font-medium">Apr 4, 2025</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Bet ID</div>
                        <div className="font-medium">{bet.id.substring(0, 8)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Original Odds</div>
                        <div className="font-medium">{formatOdds(bet.odds)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Current Odds</div>
                        <div className="font-medium flex items-center">
                          {formatOdds(bet.liveOdds || bet.odds)}
                          {bet.oddsChange === 'up' && (
                            <svg className="w-4 h-4 ml-1 text-status-win" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) }
                          {bet.oddsChange === 'down' && (
                            <svg className="w-4 h-4 ml-1 text-status-loss" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) }
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Stake</div>
                        <div className="font-medium">{formatCurrency(bet.stake || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Potential Win</div>
                        <div className="font-medium text-status-win">
                          {formatCurrency(bet.potentialWinnings || 0)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Cashout button for pending bets */}
                    {bet.status === 'pending' && (
                      <motion.button
                        className="w-full btn btn-primary text-sm"
                        onClick={() => handleCashout(bet.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cash Out {formatCurrency((bet.potentialWinnings || 0) * 0.8)}
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No bets found</p>
            <p className="text-sm mt-2">
              {filter === 'all' ? 'You haven\'t placed any bets yet' : 
               filter === 'pending' ? 'You don\'t have any pending bets' : 
               'You don\'t have any settled bets'}
            </p>
          </div>
        ) }
      </div>
    </motion.div>
  );
};

export default BetTracking;
