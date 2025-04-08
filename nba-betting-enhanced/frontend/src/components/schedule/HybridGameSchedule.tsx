// src/components/schedule/HybridGameSchedule.tsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { fetchGamesByDate } from '../../store/slices/hybridDataSlice';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const HybridGameSchedule: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { games, loading, error } = useSelector((state: RootState) => state.hybridData);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch games on component mount and when date changes
  useEffect(() => {
    dispatch(fetchGamesByDate(selectedDate));
    
    // Set up refresh interval for today's games (every 60 seconds)
    const isToday = new Date().toDateString() === selectedDate.toDateString();
    
    if (isToday) {
      const interval = setInterval(() => {
        dispatch(fetchGamesByDate(selectedDate));
      }, 60000);
      
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    // Clean up interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [dispatch, selectedDate]);

  // Group games by status
  const groupedGames = React.useMemo(() => {
    const groups = {
      live: [] as typeof games,
      upcoming: [] as typeof games,
      finished: [] as typeof games
    };
    
    games.forEach(game => {
      if (game.status.toLowerCase().includes('live') || 
          game.status.toLowerCase().includes('in progress')) {
        groups.live.push(game);
      } else if (game.status.toLowerCase().includes('final') || 
                game.status.toLowerCase().includes('finished')) {
        groups.finished.push(game);
      } else {
        groups.upcoming.push(game);
      }
    });
    
    return groups;
  }, [games]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Check if selected date is today
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  return (
    <div className="bg-betting-dark rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-primary flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">NBA Games Schedule</h2>
        <div className="flex items-center">
          {isToday && (
            <span className="inline-flex items-center mr-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-win text-white">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-white animate-pulse"></span>
              Auto-refreshing
            </span>
          )}
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && setSelectedDate(date)}
            className="bg-betting-card text-white border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            dateFormat="MMMM d, yyyy"
          />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2">{formatDate(selectedDate)}</h3>
        
        {loading.games ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error.games ? (
          <div className="bg-betting-card p-4 rounded-lg text-status-loss">
            Error loading games: {error.games}
          </div>
        ) : games.length === 0 ? (
          <div className="bg-betting-card p-4 rounded-lg text-gray-400">
            No games scheduled for this date.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Games */}
            {groupedGames.live.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <span className="mr-2 inline-block h-3 w-3 rounded-full bg-status-win animate-pulse"></span>
                  Live Games
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedGames.live.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link to={`/game/${game.id}`} className="block">
                        <div className="bg-betting-card rounded-lg overflow-hidden hover:bg-betting-highlight transition-colors">
                          <div className="p-3 bg-status-win bg-opacity-20 border-l-4 border-status-win flex justify-between items-center">
                            <span className="text-sm font-medium text-white flex items-center">
                              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-status-win animate-pulse"></span>
                              LIVE
                            </span>
                            <span className="text-sm text-gray-400">
                              {game.period > 0 ? `Q${game.period}` : ''} {game.time}
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-sm font-bold text-white">{game.awayTeam.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{game.awayTeam.name}</p>
                                  <p className="text-xs text-gray-400">{game.awayTeam.city}</p>
                                </div>
                              </div>
                              <span className="text-xl font-bold text-white">{game.awayTeam.score}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-sm font-bold text-white">{game.homeTeam.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{game.homeTeam.name}</p>
                                  <p className="text-xs text-gray-400">{game.homeTeam.city}</p>
                                </div>
                              </div>
                              <span className="text-xl font-bold text-white">{game.homeTeam.score}</span>
                            </div>
                            
                            {/* Odds display */}
                            {(game.odds.moneyline.home !== null || game.odds.spread.homePoint !== null) && (
                              <div className="mt-4 pt-3 border-t border-gray-700 grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <p className="text-xs text-gray-400">ML</p>
                                  <p className="text-sm font-medium text-white">
                                    {game.odds.moneyline.away !== null && game.odds.moneyline.away > 0 ? '+' : ''}{game.odds.moneyline.away ?? '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Spread</p>
                                  <p className="text-sm font-medium text-white">
                                    {game.odds.spread.awayPoint !== null && game.odds.spread.awayPoint > 0 ? '+' : ''}{game.odds.spread.awayPoint ?? '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Total</p>
                                  <p className="text-sm font-medium text-white">
                                    {game.odds.total.point || '-'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upcoming Games */}
            {groupedGames.upcoming.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Upcoming Games</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedGames.upcoming.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link to={`/game/${game.id}`} className="block">
                        <div className="bg-betting-card rounded-lg overflow-hidden hover:bg-betting-highlight transition-colors">
                          <div className="p-3 bg-gray-700 bg-opacity-30 flex justify-between items-center">
                            <span className="text-sm font-medium text-white">
                              {game.status}
                            </span>
                            <span className="text-sm text-gray-400">
                              {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-sm font-bold text-white">{game.awayTeam.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{game.awayTeam.name}</p>
                                  <p className="text-xs text-gray-400">{game.awayTeam.city}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-sm font-bold text-white">{game.homeTeam.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{game.homeTeam.name}</p>
                                  <p className="text-xs text-gray-400">{game.homeTeam.city}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Odds display */}
                            {(game.odds.moneyline.home !== null || game.odds.spread.homePoint !== null) && (
                              <div className="mt-4 pt-3 border-t border-gray-700 grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <p className="text-xs text-gray-400">ML</p>
                                  <p className="text-sm font-medium text-white">
                                    {game.odds.moneyline.away !== null && game.odds.moneyline.away > 0 ? '+' : ''}{game.odds.moneyline.away ?? '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Spread</p>
                                  <p className="text-sm font-medium text-white">
                                    {game.odds.spread.awayPoint !== null && game.odds.spread.awayPoint > 0 ? '+' : ''}{game.odds.spread.awayPoint ?? '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Total</p>
                                  <p className="text-sm font-medium text-white">
                                    {game.odds.total.point || '-'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Finished Games */}
            {groupedGames.finished.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Completed Games</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedGames.finished.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link to={`/game/${game.id}`} className="block">
                        <div className="bg-betting-card rounded-lg overflow-hidden hover:bg-betting-highlight transition-colors">
                          <div className="p-3 bg-gray-700 bg-opacity-30 flex justify-between items-center">
                            <span className="text-sm font-medium text-white">
                              {game.status}
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-sm font-bold text-white">{game.awayTeam.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{game.awayTeam.name}</p>
                                  <p className="text-xs text-gray-400">{game.awayTeam.city}</p>
                                </div>
                              </div>
                              <span className={`text-xl font-bold ${game.awayTeam.score > game.homeTeam.score ? 'text-status-win' : 'text-white'}`}>
                                {game.awayTeam.score}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-sm font-bold text-white">{game.homeTeam.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{game.homeTeam.name}</p>
                                  <p className="text-xs text-gray-400">{game.homeTeam.city}</p>
                                </div>
                              </div>
                              <span className={`text-xl font-bold ${game.homeTeam.score > game.awayTeam.score ? 'text-status-win' : 'text-white'}`}>
                                {game.homeTeam.score}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HybridGameSchedule;
