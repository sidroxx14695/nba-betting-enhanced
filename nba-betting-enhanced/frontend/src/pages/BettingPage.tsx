import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BetSlip from '../components/betting/BetSlip';
import BetTracking from '../components/betting/BetTracking';
import ParlayBuilder from '../components/betting/ParlayBuilder';

// Types
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

const BettingPage: React.FC = () => {
  // State
  const [activeBets, setActiveBets] = useState<BetItem[]>([]);
  const [betHistory, setBetHistory] = useState<BetItem[]>([]);
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [activeTab, setActiveTab] = useState<'builder' | 'history'>('builder');
  
  // Load mock data
  useEffect(() => {
    // Mock games data
    const mockGames: Game[] = [
      {
        id: 'game1',
        homeTeam: {
          id: 'lakers',
          name: 'Lakers',
          logo: 'https://via.placeholder.com/50?text=LAL'
        },
        awayTeam: {
          id: 'warriors',
          name: 'Warriors',
          logo: 'https://via.placeholder.com/50?text=GSW'
        },
        status: 'scheduled',
        startTime: '2025-04-04T19:30:00Z',
        odds: {
          homeMoneyline: -150,
          awayMoneyline: +130,
          spread: -3.5,
          spreadHome: -110,
          spreadAway: -110,
          total: 224.5,
          overOdds: -110,
          underOdds: -110
        }
      },
      {
        id: 'game2',
        homeTeam: {
          id: 'celtics',
          name: 'Celtics',
          logo: 'https://via.placeholder.com/50?text=BOS'
        },
        awayTeam: {
          id: 'nets',
          name: 'Nets',
          logo: 'https://via.placeholder.com/50?text=BKN'
        },
        status: 'live',
        startTime: '2025-04-04T18:00:00Z',
        odds: {
          homeMoneyline: -200,
          awayMoneyline: +170,
          spread: -5.5,
          spreadHome: -110,
          spreadAway: -110,
          total: 219.5,
          overOdds: -110,
          underOdds: -110
        }
      },
      {
        id: 'game3',
        homeTeam: {
          id: 'heat',
          name: 'Heat',
          logo: 'https://via.placeholder.com/50?text=MIA'
        },
        awayTeam: {
          id: 'bulls',
          name: 'Bulls',
          logo: 'https://via.placeholder.com/50?text=CHI'
        },
        status: 'scheduled',
        startTime: '2025-04-04T20:00:00Z',
        odds: {
          homeMoneyline: -120,
          awayMoneyline: +100,
          spread: -1.5,
          spreadHome: -110,
          spreadAway: -110,
          total: 210.5,
          overOdds: -110,
          underOdds: -110
        }
      }
    ];
    
    // Mock bet history
    const mockBetHistory: BetItem[] = [
      {
        id: 'bet1',
        gameId: 'past-game1',
        homeTeam: 'Knicks',
        awayTeam: 'Bucks',
        betType: 'moneyline',
        selection: 'Knicks',
        odds: +120,
        stake: 50,
        potentialWinnings: 60,
        status: 'won',
        liveOdds: +120,
        oddsChange: 'none'
      },
      {
        id: 'bet2',
        gameId: 'past-game2',
        homeTeam: 'Suns',
        awayTeam: 'Mavericks',
        betType: 'spread',
        selection: 'Mavericks +4.5',
        odds: -110,
        stake: 100,
        potentialWinnings: 90.91,
        status: 'lost',
        liveOdds: -110,
        oddsChange: 'none'
      },
      {
        id: 'bet3',
        gameId: 'game2',
        homeTeam: 'Celtics',
        awayTeam: 'Nets',
        betType: 'total',
        selection: 'Over 219.5',
        odds: -110,
        stake: 75,
        potentialWinnings: 68.18,
        status: 'pending',
        liveOdds: -105,
        oddsChange: 'up'
      }
    ];
    
    setAvailableGames(mockGames) ;
    setBetHistory(mockBetHistory);
  }, []);
  
  // Handle adding selections to bet slip
  const handleAddToBetSlip = (selections: BetSelection[]) => {
    const newBets = selections.map(selection => ({
      id: selection.id,
      gameId: selection.gameId,
      homeTeam: availableGames.find(game => game.id === selection.gameId)?.homeTeam.name || '',
      awayTeam: availableGames.find(game => game.id === selection.gameId)?.awayTeam.name || '',
      betType: selection.betType,
      selection: selection.selection,
      odds: selection.odds,
      stake: 10, // Default stake
      potentialWinnings: calculatePotentialWinnings(selection.odds, 10)
    }));
    
    setActiveBets([...activeBets, ...newBets]);
  };
  
  // Handle bet removal
  const handleBetRemoved = (betId: string) => {
    setActiveBets(activeBets.filter(bet => bet.id !== betId));
  };
  
  // Handle bet update
  const handleBetUpdated = (updatedBet: BetItem) => {
    setActiveBets(activeBets.map(bet => 
      bet.id === updatedBet.id ? updatedBet : bet
    ));
  };
  
  // Handle place bet
  const handlePlaceBet = (bets: BetItem[], totalStake: number, totalPotentialWinnings: number) => {
    // Add bets to history with pending status
    const newHistoryBets = bets.map(bet => ({
      ...bet,
      status: 'pending' as const
    }));
    
    setBetHistory([...betHistory, ...newHistoryBets]);
    setActiveBets([]);
  };
  
  // Handle cashout
  const handleCashout = (betId: string) => {
    setBetHistory(betHistory.map(bet => 
      bet.id === betId ? { ...bet, status: 'cashout' } : bet
    ));
  };
  
  // Calculate potential winnings
  const calculatePotentialWinnings = (odds: number, stake: number): number => {
    if (odds > 0) {
      return (odds / 100) * stake;
    } else {
      return (100 / Math.abs(odds)) * stake;
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
  
  const tabVariants = {
    inactive: { 
      borderColor: 'rgba(75, 85, 99, 0)',
      color: 'rgba(156, 163, 175, 1)'
    },
    active: { 
      borderColor: 'rgba(30, 64, 175, 1)',
      color: 'rgba(255, 255, 255, 1)',
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        className="mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-3xl font-bold mb-2">Betting Center</h1>
        <p className="text-gray-400">Place bets, build parlays, and track your betting history</p>
      </motion.div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        <motion.button
          className="py-3 px-6 text-center font-medium border-b-2 border-transparent"
          variants={tabVariants}
          animate={activeTab === 'builder' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('builder')}
        >
          Parlay Builder
        </motion.button>
        <motion.button
          className="py-3 px-6 text-center font-medium border-b-2 border-transparent"
          variants={tabVariants}
          animate={activeTab === 'history' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('history')}
        >
          Betting History
        </motion.button>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'builder' ? (
              <motion.div
                key="builder"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ParlayBuilder 
                  availableGames={availableGames}
                  onAddToBetSlip={handleAddToBetSlip}
                />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BetTracking 
                  bets={betHistory}
                  onCashout={handleCashout}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Right column - Bet slip is always visible */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <BetSlip
              initialBets={activeBets}
              onBetRemoved={handleBetRemoved}
              onBetUpdated={handleBetUpdated}
              onPlaceBet={handlePlaceBet}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile bet slip */}
      <div className="lg:hidden">
        <BetSlip
          initialBets={activeBets}
          onBetRemoved={handleBetRemoved}
          onBetUpdated={handleBetUpdated}
          onPlaceBet={handlePlaceBet}
        />
      </div>
    </div>
  );
};

export default BettingPage;
