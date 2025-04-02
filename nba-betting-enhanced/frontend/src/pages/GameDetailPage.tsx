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
import ScorePredictionChart from '../../ScorePredictionChart';

const GameDetailPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const dispatch = useDispatch();
  const { selectedGame } = useSelector((state: RootState) => state.games);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { gameSocket } = useSocket();

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
        dispatch(selectGame(update));
      }
    };

    gameSocket.on('game_update', handleGameUpdate);

    // Clean up on unmount
    return () => {
      gameSocket.off('game_update', handleGameUpdate);
      gameSocket.emit('leave_game', gameId);
    };
  }, [gameSocket, gameId, dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">Loading game details...</p>
      </div>
    );
  }

  if (error || !selectedGame) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-red-500">{error || 'Game not found'}</p>
      </div>
    );
  }

  const { homeTeam, awayTeam, status, period, timeRemaining, predictions } = selectedGame;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
      >
        <div className="bg-gray-700 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Game Details</h1>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                status === 'In Progress' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="text-sm font-medium">
                {status === 'In Progress' ? 'LIVE' : status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex flex-col items-center mb-4 md:mb-0">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">{homeTeam.name.substring(0, 1)}</span>
              </div>
              <h2 className="text-xl font-bold">{homeTeam.name}</h2>
              <p className="text-gray-400">Home</p>
            </div>
            
            <div className="flex flex-col items-center mb-4 md:mb-0">
              <div className="text-4xl font-bold mb-2">
                {homeTeam.score} - {awayTeam.score}
              </div>
              {status === 'In Progress' && (
                <div className="text-sm font-medium text-gray-400">
                  {period <= 4 ? `Q${period}` : `OT${period - 4}`}
                  {' '}
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">{awayTeam.name.substring(0, 1)}</span>
              </div>
              <h2 className="text-xl font-bold">{awayTeam.name}</h2>
              <p className="text-gray-400">Away</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-400 mb-1">Home Win Probability</p>
              <p className="text-2xl font-bold">
                {(predictions.winProbability.home * 100).toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-400 mb-1">Spread</p>
              <p className="text-2xl font-bold">
                {predictions.spread.value > 0 ? '+' : ''}
                {predictions.spread.value.toFixed(1)}
              </p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-400 mb-1">Projected Total</p>
              <p className="text-2xl font-bold">
                {predictions.total.value.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WinProbabilityChart
          gameId={gameId || ''}
          homeTeam={homeTeam.name}
          homeColor="#1E40AF"
          awayTeam={awayTeam.name}
          awayColor="#DC2626"
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
          homeColor="#1E40AF"
          awayTeam={awayTeam.name}
          awayColor="#DC2626"
          currentHomeScore={homeTeam.score}
          currentAwayScore={awayTeam.score}
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4">Betting Odds</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Market</th>
                <th className="px-4 py-3 text-right">{homeTeam.name}</th>
                <th className="px-4 py-3 text-right">{awayTeam.name}</th>
                <th className="px-4 py-3 text-right">Over/Under</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <tr>
                <td className="px-4 py-3">Moneyline</td>
                <td className="px-4 py-3 text-right font-medium">
                  {selectedGame.odds.live?.homeMoneyline || selectedGame.odds.pregame?.homeMoneyline || '-'}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {selectedGame.odds.live?.awayMoneyline || selectedGame.odds.pregame?.awayMoneyline || '-'}
                </td>
                <td className="px-4 py-3 text-right">-</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Spread</td>
                <td className="px-4 py-3 text-right font-medium">
                  {selectedGame.odds.live?.spread || selectedGame.odds.pregame?.spread || '-'}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {selectedGame.odds.live?.spread ? 
                    `+${Math.abs(selectedGame.odds.live.spread)}` : 
                    selectedGame.odds.pregame?.spread ? 
                      `+${Math.abs(selectedGame.odds.pregame.spread)}` : 
                      '-'
                  }
                </td>
                <td className="px-4 py-3 text-right">-</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">-</td>
                <td className="px-4 py-3 text-right">-</td>
                <td className="px-4 py-3 text-right font-medium">
                  {selectedGame.odds.live?.total || selectedGame.odds.pregame?.total || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default GameDetailPage;
