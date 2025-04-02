import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchGamesStart, fetchGamesSuccess, fetchGamesFailure } from '../store/slices/gamesSlice';
import axios from 'axios';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeGames, loading, error } = useSelector((state: RootState) => state.games);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchGames = async () => {
      dispatch(fetchGamesStart());
      try {
        const response = await axios.get('/api/games/active');
        dispatch(fetchGamesSuccess(response.data));
      } catch (err) {
        dispatch(fetchGamesFailure('Failed to fetch active games'));
      }
    };

    fetchGames();
    // Set up polling for active games
    const interval = setInterval(fetchGames, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleGameClick = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-4">NBA Betting MVP</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Real-time in-game predictions and personalized betting recommendations
          based on your risk profile.
        </p>
        
        {!isAuthenticated && (
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-colors"
            >
              Register
            </button>
          </div>
        )}
      </motion.div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Today's Games</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading games...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : activeGames.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No active games at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeGames.map((game) => (
              <motion.div
                key={game.gameId}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer"
                onClick={() => handleGameClick(game.gameId)}
              >
                <div className="p-4 bg-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-400">
                      {game.status === 'In Progress' ? 'LIVE' : game.status}
                    </div>
                    {game.status === 'In Progress' && (
                      <div className="text-sm font-medium text-gray-400">
                        {game.period <= 4 ? `Q${game.period}` : `OT${game.period - 4}`}
                        {' '}
                        {Math.floor(game.timeRemaining / 60)}:
                        {(game.timeRemaining % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                        {game.homeTeam.name.substring(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold">{game.homeTeam.name}</div>
                        <div className="text-sm text-gray-400">Home</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {game.homeTeam.score}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-2">
                        {game.awayTeam.name.substring(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold">{game.awayTeam.name}</div>
                        <div className="text-sm text-gray-400">Away</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {game.awayTeam.score}
                    </div>
                  </div>
                  
                  {game.predictions && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex justify-between text-sm">
                        <div>Win Probability:</div>
                        <div className="font-medium">
                          {game.homeTeam.name}: {(game.predictions.winProbability.home * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
