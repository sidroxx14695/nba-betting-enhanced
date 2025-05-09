import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { selectGame } from '../store/slices/gamesSlice';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { motion } from 'framer-motion';

// Components
import WinProbabilityChart from '../components/visualizations/WinProbabilityChart';
import ScorePredictionChart from "../components/visualizations/ScorePredictionChart";
import GameVisualizationDashboard from '../components/visualizations/GameVisualizationDashboard'; // Updated path to match the correct location
import LiveScoreAnimation from '../components/visualizations/LiveScoreAnimation'; // Updated path to match the correct location
import GameNotification from '../components/notifications/GameNotification';

// Extended interfaces to match the actual data structure
interface TeamExtended {
  id: string;
  name: string;
  score: number;
  logo?: string;
  city?: string;
}

interface PredictionsExtended {
  winProbability: {
    home: number;
    away: number;
    confidence: number;
  };
  spread: {
    value: number;
    confidence: number;
    favorite?: 'home' | 'away';
  };
  total: {
    value: number;
    confidence: number;
    recommendation?: 'over' | 'under';
  };
}

const GameDetailPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string; }>();
  const dispatch = useDispatch();
  const { selectedGame } = useSelector((state: RootState) => state.games);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { gameSocket } = useSocket();
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [prevOdds, setPrevOdds] = useState<{
    homeMoneyline: number | null;
    awayMoneyline: number | null;
    spread: number | null;
    total: number | null;
  }>({
    homeMoneyline: null,
    awayMoneyline: null,
    spread: null,
    total: null
  });
  const [oddsChanged, setOddsChanged] = useState<{
    homeMoneyline: boolean;
    awayMoneyline: boolean;
    spread: boolean;
    total: boolean;
  }>({
    homeMoneyline: false,
    awayMoneyline: false,
    spread: false,
    total: false
  });
  
  // Game notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  useEffect(() => {
    const fetchGameDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/api/games/${gameId}`);
        dispatch(selectGame(response.data));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch game details');
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameId, dispatch]);

  useEffect(() => {
    if (!gameSocket) return;

    // Join game room
    gameSocket.emit('join_game', gameId);

    // Listen for game updates
    const handleGameUpdate = (update: any) => {
      if (update.gameId === gameId) {
        // Check for game status changes
        if (selectedGame && selectedGame.status !== update.status) {
          // Game started notification
          if (update.status === 'In Progress' && selectedGame.status !== 'In Progress') {
            setNotification({
              message: `Game between ${update.homeTeam.name} and ${update.awayTeam.name} has started!`,
              type: 'info',
              isVisible: true
            });
          }
          
          // Game ended notification
          if (update.status === 'Final' && selectedGame.status !== 'Final') {
            const winner = update.homeTeam.score > update.awayTeam.score ? update.homeTeam.name : update.awayTeam.name;
            setNotification({
              message: `Game ended! ${winner} wins!`,
              type: 'success',
              isVisible: true
            });
          }
        }
        
        // Check for period changes
        if (selectedGame && selectedGame.period !== update.period) {
          if (update.period <= 4) {
            setNotification({
              message: `Quarter ${update.period} has started!`,
              type: 'info',
              isVisible: true
            });
          } else {
            setNotification({
              message: `Overtime ${update.period - 4} has started!`,
              type: 'warning',
              isVisible: true
            });
          }
        }
        
        // Check for odds changes before updating state
        if (selectedGame) {
          const currentLiveOdds = selectedGame.odds.live;
          const newLiveOdds = update.odds.live;
          
          // Store previous odds values
          setPrevOdds({
            homeMoneyline: currentLiveOdds?.homeMoneyline || null,
            awayMoneyline: currentLiveOdds?.awayMoneyline || null,
            spread: currentLiveOdds?.spread || null,
            total: currentLiveOdds?.total || null
          });
          
          // Check which odds have changed
          setOddsChanged({
            homeMoneyline: currentLiveOdds?.homeMoneyline !== newLiveOdds?.homeMoneyline && newLiveOdds?.homeMoneyline !== undefined,
            awayMoneyline: currentLiveOdds?.awayMoneyline !== newLiveOdds?.awayMoneyline && newLiveOdds?.awayMoneyline !== undefined,
            spread: currentLiveOdds?.spread !== newLiveOdds?.spread && newLiveOdds?.spread !== undefined,
            total: currentLiveOdds?.total !== newLiveOdds?.total && newLiveOdds?.total !== undefined
          });
          
          // Notify about significant odds changes
          if (currentLiveOdds && newLiveOdds) {
            const homeMoneylineDiff = Math.abs((newLiveOdds.homeMoneyline || 0) - (currentLiveOdds.homeMoneyline || 0));
            const awayMoneylineDiff = Math.abs((newLiveOdds.awayMoneyline || 0) - (currentLiveOdds.awayMoneyline || 0));
            
            // Notify on significant moneyline shifts (50+ points)
            if (homeMoneylineDiff > 50 || awayMoneylineDiff > 50) {
              setNotification({
                message: `Significant odds shift detected! Check the latest betting lines.`,
                type: 'warning',
                isVisible: true
              });
            }
          }
        }
        
        // Update game data in Redux
        dispatch(selectGame(update));
        
        // Reset odds change indicators after animation
        setTimeout(() => {
          setOddsChanged({
            homeMoneyline: false,
            awayMoneyline: false,
            spread: false,
            total: false
          });
        }, 3000);
      }
    };

    // Listen for specific odds updates
    const handleOddsUpdate = (data: any) => {
      if (data.gameId === gameId && selectedGame) {
        // Create updated game object with new odds
        const updatedGame = {
          ...selectedGame,
          odds: {
            ...selectedGame.odds,
            live: {
              ...selectedGame.odds.live,
              ...data.odds
            }
          }
        };
        
        // Store previous odds values
        setPrevOdds({
          homeMoneyline: selectedGame.odds.live?.homeMoneyline || null,
          awayMoneyline: selectedGame.odds.live?.awayMoneyline || null,
          spread: selectedGame.odds.live?.spread || null,
          total: selectedGame.odds.live?.total || null
        });
        
        // Check which odds have changed
        setOddsChanged({
          homeMoneyline: data.odds.homeMoneyline !== undefined && data.odds.homeMoneyline !== selectedGame.odds.live?.homeMoneyline,
          awayMoneyline: data.odds.awayMoneyline !== undefined && data.odds.awayMoneyline !== selectedGame.odds.live?.awayMoneyline,
          spread: data.odds.spread !== undefined && data.odds.spread !== selectedGame.odds.live?.spread,
          total: data.odds.total !== undefined && data.odds.total !== selectedGame.odds.live?.total
        });
        
        // Update game data in Redux
        dispatch(selectGame(updatedGame));
        
        // Reset odds change indicators after animation
        setTimeout(() => {
          setOddsChanged({
            homeMoneyline: false,
            awayMoneyline: false,
            spread: false,
            total: false
          });
        }, 3000);
      }
    };

    gameSocket.on('game_update', handleGameUpdate);
    gameSocket.on(`game:${gameId}:odds_update`, handleOddsUpdate);

    // Clean up on unmount
    return () => {
      gameSocket.off('game_update', handleGameUpdate);
      gameSocket.off(`game:${gameId}:odds_update`, handleOddsUpdate);
      gameSocket.emit('leave_game', gameId);
    };
  }, [gameSocket, gameId, dispatch, selectedGame]);

  // Handle bet selection
  const handleBetSelect = (betType: string) => {
    setSelectedBet(selectedBet === betType ? null : betType);
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  // Calculate potential winnings based on odds
  const calculateWinnings = (odds: number) => {
    if (odds > 0) {
      return ((odds / 100) * betAmount).toFixed(2);
    } else {
      return ((betAmount * 100) / Math.abs(odds)).toFixed(2);
    }
  };

  // Handle bet amount change
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setBetAmount(value);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400">Loading game details...</p>
        </div>
      </div>
    ) ;
  }

  if (error || !selectedGame) {
    return (
      <div className="card p-6 text-center">
        <p className="text-status-loss">{error || 'Game not found'}</p>
      </div>
    );
  }

  // Cast to extended interfaces to handle additional properties
  const { homeTeam, awayTeam, status, period, timeRemaining, predictions } = selectedGame;
  const homeTeamExt = homeTeam as unknown as TeamExtended;
  const awayTeamExt = awayTeam as unknown as TeamExtended;
  const predictionsExt = predictions as unknown as PredictionsExtended;
  
  // Determine team colors (using our theme colors for now)
  const homeTeamColor = 'team-lakers'; // This would ideally be dynamically assigned based on team
  const awayTeamColor = 'team-heat';   // This would ideally be dynamically assigned based on team
  
  // Determine which team is winning
  const homeTeamWinning = homeTeam.score > awayTeam.score;
  const awayTeamWinning = awayTeam.score > homeTeam.score;
  const isTied = homeTeam.score === awayTeam.score;
  
  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <div className="space-y-8">
      {/* Game Notification Component */}
      <GameNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={handleCloseNotification}
        duration={5000}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card overflow-hidden relative"
      >
        {/* Background gradient based on team colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-betting-card to-betting-highlight opacity-80 z-0"></div>
        
        {/* Live indicator */}
        {status === 'In Progress' && (
          <div className="absolute top-4 right-4 z-10">
            <div className="badge-live flex items-center">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-live opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-status-live"></span>
              </span>
              LIVE
            </div>
          </div>
        )}

        <div className="relative z-10 p-6">
          <h1 className="text-2xl font-bold mb-6 text-white">Game Details</h1>

          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            {/* Home Team */}
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <div className="w-24 h-24 bg-betting-highlight rounded-full flex items-center justify-center mb-3 shadow-lg p-2">
                <img 
                  src={homeTeamExt.logo} 
                  alt={`${homeTeam.name} logo`} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Team';
                  }}
                />
              </div>
              <h2 className="text-xl font-bold text-white">{homeTeamExt.city}</h2>
              <h3 className="text-lg text-gray-300">{homeTeam.name}</h3>
            </div>

            {/* Score Display */}
            <div className="flex flex-col items-center mb-6 md:mb-0">
              {/* Live Score Animation for real-time updates */}
              <div className="mb-2">
                <LiveScoreAnimation
                  gameId={gameId || ''}
                  initialHomeScore={homeTeam.score}
                  initialAwayScore={awayTeam.score}
                  homeTeam={homeTeam.name}
                  awayTeam={awayTeam.name}
                  homeTeamColor="#1E40AF" // Using primary color
                  awayTeamColor="#D97706" // Using secondary color
                />
              </div>
              
              {status === 'In Progress' && (
                <div className="mt-2 px-4 py-1 bg-betting-highlight rounded-full text-sm font-medium text-white">
                  <span className="relative flex h-3 w-3 mr-1 inline-block">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-live opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-status-live"></span>
                  </span>
                  {period <= 4 ? `Q${period}` : `OT${period - 4}`}
                  {' '}
                  {formatTimeRemaining(timeRemaining) }
                </div>
              )}
              
              {status !== 'In Progress' && (
                <div className="mt-2 px-4 py-1 bg-betting-highlight rounded-full text-sm font-medium text-white">
                  {status}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-betting-highlight rounded-full flex items-center justify-center mb-3 shadow-lg p-2">
                <img 
                  src={awayTeamExt.logo} 
                  alt={`${awayTeam.name} logo`} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Team';
                  }}
                />
              </div>
              <h2 className="text-xl font-bold text-white">{awayTeamExt.city}</h2>
              <h3 className="text-lg text-gray-300">{awayTeam.name}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Home Win Probability</p>
              <div className="relative pt-1">
                <div className="overflow-hidden h-4 text-xs flex rounded-full bg-betting-highlight">
                  <div 
                    style={{ width: `${predictions.winProbability.home * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                  ></div>
                </div>
                <p className="text-2xl font-bold mt-2 text-white">
                  {(predictions.winProbability.home * 100) .toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="card p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Spread</p>
              <div className="flex justify-center items-center h-10">
                <div className={`text-2xl font-bold ${predictionsExt.spread.favorite === 'home' ? 'text-primary' : 'text-secondary'}`}>
                  {predictionsExt.spread.favorite === 'home' ? homeTeam.name : awayTeam.name}
                </div>
                <div className="text-2xl font-bold mx-2 text-white">
                  {predictions.spread.value > 0 ? '+' : ''}
                  {predictions.spread.value.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="card p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Projected Total</p>
              <div className="flex flex-col justify-center items-center">
                <p className="text-2xl font-bold text-white">
                  {predictions.total.value.toFixed(1)}
                </p>
                <div className="flex mt-1">
                  <span className={`text-sm ${predictionsExt.total.recommendation === 'over' ? 'text-status-win' : 'text-gray-400'}`}>
                    OVER
                  </span>
                  <span className="text-sm mx-2 text-gray-500">|</span>
                  <span className={`text-sm ${predictionsExt.total.recommendation === 'under' ? 'text-status-win' : 'text-gray-400'}`}>
                    UNDER
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WinProbabilityChart
          gameId={gameId || ''}
          homeTeam={homeTeam.name}
          homeColor="#1E40AF" // Using primary color
          awayTeam={awayTeam.name}
          awayColor="#D97706" // Using secondary color
          initialData={[
            {
              timestamp: new Date().toISOString(),
              homeWinProbability: predictions.winProbability.home,
              awayWinProbability: predictions.winProbability.away,
              gameTime: period <= 4 ? `Q${period}` : `OT${period - 4}`
            }
          ]} 
        />

        <ScorePredictionChart
          gameId={gameId || ''}
          homeTeam={homeTeam.name}
          homeColor="#1E40AF" // Using primary color
          awayTeam={awayTeam.name}
          awayColor="#D97706" // Using secondary color
          currentHomeScore={homeTeam.score}
          currentAwayScore={awayTeam.score} 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <GameVisualizationDashboard
          gameId={gameId || ''}
          homeTeam={{
            id: homeTeam.id,
            name: homeTeam.name,
            score: homeTeam.score,
            logo: homeTeamExt.logo
          }}
          awayTeam={{
            id: awayTeam.id,
            name: awayTeam.name,
            score: awayTeam.score,
            logo: awayTeamExt.logo
          }}
          status={status}
          quarter={period}
          timeRemaining={formatTimeRemaining(timeRemaining)}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card p-6"
      >
        <h2 className="text-xl font-bold mb-6 text-white">Betting Options</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Moneyline Bet Card */}
          <div 
            className={`card p-4 cursor-pointer transition-all duration-200 ${selectedBet === 'moneyline-home' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleBetSelect('moneyline-home')}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 mr-2">
                  <img 
                    src={homeTeamExt.logo} 
                    alt={`${homeTeam.name} logo`} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                    }}
                  />
                </div>
                <span className="font-medium text-white">{homeTeam.name}</span>
              </div>
              <motion.span 
                className="text-lg font-bold"
                style={{ 
                  color: oddsChanged.homeMoneyline ? '#10B981' : 'white',
                  textShadow: oddsChanged.homeMoneyline ? '0 0 8px #10B981' : 'none'
                }}
                animate={oddsChanged.homeMoneyline ? 
                  { scale: [1, 1.2, 1], transition: { duration: 0.5 } } : 
                  { scale: 1 }
                }
              >
                {selectedGame.odds.live?.homeMoneyline || selectedGame.odds.pregame?.homeMoneyline || '-'}
                {oddsChanged.homeMoneyline && prevOdds.homeMoneyline !== null && (
                  <span className="text-xs ml-1">
                    {(selectedGame.odds.live?.homeMoneyline || 0)  > prevOdds.homeMoneyline ? '↑' : '↓'}
                  </span>
                )}
              </motion.span>
            </div>
            <p className="text-sm text-gray-400">Moneyline</p>
          </div>

          {/* Moneyline Bet Card */}
          <div 
            className={`card p-4 cursor-pointer transition-all duration-200 ${selectedBet === 'moneyline-away' ? 'ring-2 ring-secondary' : ''}`}
            onClick={() => handleBetSelect('moneyline-away')}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 mr-2">
                  <img 
                    src={awayTeamExt.logo} 
                    alt={`${awayTeam.name} logo`} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                    }}
                  />
                </div>
                <span className="font-medium text-white">{awayTeam.name}</span>
              </div>
              <motion.span 
                className="text-lg font-bold"
                style={{ 
                  color: oddsChanged.awayMoneyline ? '#10B981' : 'white',
                  textShadow: oddsChanged.awayMoneyline ? '0 0 8px #10B981' : 'none'
                }}
                animate={oddsChanged.awayMoneyline ? 
                  { scale: [1, 1.2, 1], transition: { duration: 0.5 } } : 
                  { scale: 1 }
                }
              >
                {selectedGame.odds.live?.awayMoneyline || selectedGame.odds.pregame?.awayMoneyline || '-'}
                {oddsChanged.awayMoneyline && prevOdds.awayMoneyline !== null && (
                  <span className="text-xs ml-1">
                    {(selectedGame.odds.live?.awayMoneyline || 0)  > prevOdds.awayMoneyline ? '↑' : '↓'}
                  </span>
                )}
              </motion.span>
            </div>
            <p className="text-sm text-gray-400">Moneyline</p>
          </div>

          {/* Total Bet Card */}
          <div 
            className={`card p-4 cursor-pointer transition-all duration-200 ${selectedBet === 'total-over' ? 'ring-2 ring-status-win' : ''}`}
            onClick={() => handleBetSelect('total-over')}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-white">Over</span>
              <motion.span 
                className="text-lg font-bold"
                style={{ 
                  color: oddsChanged.total ? '#10B981' : 'white',
                  textShadow: oddsChanged.total ? '0 0 8px #10B981' : 'none'
                }}
                animate={oddsChanged.total ? 
                  { scale: [1, 1.2, 1], transition: { duration: 0.5 } } : 
                  { scale: 1 }
                }
              >
                {selectedGame.odds.live?.total || selectedGame.odds.pregame?.total || '-'}
                {oddsChanged.total && prevOdds.total !== null && (
                  <span className="text-xs ml-1">
                    {(selectedGame.odds.live?.total || 0) > prevOdds.total ? '↑' : '↓'}
                  </span>
                )}
              </motion.span>
            </div>
            <p className="text-sm text-gray-400">Total Points</p>
          </div>
        </div>

        {/* Bet Slip */}
        {selectedBet && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-4 mt-4"
          >
            <h3 className="text-lg font-bold mb-4 text-white">Your Bet</h3>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <p className="text-white font-medium">
                  {selectedBet === 'moneyline-home' && `${homeTeam.name} to win`}
                  {selectedBet === 'moneyline-away' && `${awayTeam.name} to win`}
                  {selectedBet === 'total-over' && `Over ${selectedGame.odds.live?.total || selectedGame.odds.pregame?.total || '-'} points`}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedBet.includes('moneyline') ? 'Moneyline' : 'Total'}
                </p>
              </div>
              
              <div className="mt-2 md:mt-0">
                <div className="flex items-center">
                  <label htmlFor="betAmount" className="mr-2 text-white">Bet Amount:</label>
                  <input
                    id="betAmount"
                    type="number"
                    min="1"
                    value={betAmount}
                    onChange={handleBetAmountChange}
                    className="input w-24 text-right"
                  />
                </div>
                
                <p className="text-sm text-gray-400 mt-1 text-right">
                  Potential Win: $
                  {selectedBet === 'moneyline-home' && 
                    calculateWinnings(selectedGame.odds.live?.homeMoneyline || selectedGame.odds.pregame?.homeMoneyline || 0)}
                  {selectedBet === 'moneyline-away' && 
                    calculateWinnings(selectedGame.odds.live?.awayMoneyline || selectedGame.odds.pregame?.awayMoneyline || 0)}
                  {selectedBet === 'total-over' && 
                    calculateWinnings(-110)} {/* Standard odds for over/under */}
                </p>
              </div>
            </div>
            
            <button className="btn btn-primary w-full">
              Place Bet
            </button>
          </motion.div>
        )}

        {/* Odds Table */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4 text-white">All Betting Odds</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-betting-highlight">
                <tr>
                  <th className="px-4 py-3 text-left text-white">Market</th>
                  <th className="px-4 py-3 text-right text-white">{homeTeam.name}</th>
                  <th className="px-4 py-3 text-right text-white">{awayTeam.name}</th>
                  <th className="px-4 py-3 text-right text-white">Over/Under</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr className="bg-betting-card hover:bg-betting-highlight transition-colors">
                  <td className="px-4 py-3 text-white">Moneyline</td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {selectedGame.odds.live?.homeMoneyline || selectedGame.odds.pregame?.homeMoneyline || '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {selectedGame.odds.live?.awayMoneyline || selectedGame.odds.pregame?.awayMoneyline || '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">-</td>
                </tr>
                <tr className="bg-betting-card hover:bg-betting-highlight transition-colors">
                  <td className="px-4 py-3 text-white">Spread</td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {selectedGame.odds.live?.spread || selectedGame.odds.pregame?.spread || '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {selectedGame.odds.live?.spread ?
                      `+${Math.abs(selectedGame.odds.live.spread)}` :
                      selectedGame.odds.pregame?.spread ?
                        `+${Math.abs(selectedGame.odds.pregame.spread)}` :
                        '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">-</td>
                </tr>
                <tr className="bg-betting-card hover:bg-betting-highlight transition-colors">
                  <td className="px-4 py-3 text-white">Total</td>
                  <td className="px-4 py-3 text-right text-gray-400">-</td>
                  <td className="px-4 py-3 text-right text-gray-400">-</td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {selectedGame.odds.live?.total || selectedGame.odds.pregame?.total || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GameDetailPage;
