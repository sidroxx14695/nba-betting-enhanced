// src/components/HybridGameDetail.tsx - Game detail component using hybrid API data

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchGameById, fetchStatsByGame } from '../store/slices/hybridDataSlice';
import { motion } from 'framer-motion';
import HybridPlayerStatsList from './players/HybridPlayerStatsList';
import TeamStatsRadarChart from './visualizations/TeamStatsRadarChart';
import GameScoreTimeline from './visualizations/GameScoreTimeline';

interface HybridGameDetailProps {
  gameId: number;
}

const HybridGameDetail: React.FC<HybridGameDetailProps> = ({ gameId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedGame, playerStats, loading, error } = useSelector((state: RootState) => state.hybridData);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [scoreTimeline, setScoreTimeline] = useState<any[]>([]);

  // Fetch game details on component mount
  useEffect(() => {
    if (gameId) {
      dispatch(fetchGameById(gameId));
      dispatch(fetchStatsByGame(gameId));
      
      // Set up refresh interval for live games (every 30 seconds)
      if (selectedGame?.status.toLowerCase().includes('live') || 
          selectedGame?.status.toLowerCase().includes('in progress')) {
        const interval = setInterval(() => {
          dispatch(fetchGameById(gameId));
        }, 30000);
        
        setRefreshInterval(interval);
      }
    }
    
    // Clean up interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [dispatch, gameId, selectedGame?.status]);

  // Generate mock score timeline for visualization
  useEffect(() => {
    if (selectedGame) {
      // This is a simplified mock - in a real app, you'd get this from the API
      const mockTimeline: { period: number; time: string; homeScore: number; awayScore: number }[] = [];
      const periods = selectedGame.period || 4;
      const homeScore = selectedGame.homeTeam.score;
      const awayScore = selectedGame.awayTeam.score;
      
      // Create timeline points
      for (let period = 1; period <= periods; period++) {
        for (let minute = 12; minute >= 0; minute -= 3) {
          // Calculate progressive scores
          const progressRatio = (period * 12 - minute) / (periods * 12);
          const currentHomeScore = Math.floor(homeScore * progressRatio);
          const currentAwayScore = Math.floor(awayScore * progressRatio);
          
          mockTimeline.push({
            period,
            time: `${minute}:00`,
            homeScore: currentHomeScore,
            awayScore: currentAwayScore
          });
        }
      }
      
      setScoreTimeline(mockTimeline);
    }
  }, [selectedGame]);

  // Calculate team stats for visualization
  const calculateTeamStats = () => {
    if (!playerStats.length) return { homeTeamStats: null, awayTeamStats: null };
    
    // Group stats by team
    const homeTeamId = selectedGame?.homeTeam.id;
    const awayTeamId = selectedGame?.awayTeam.id;
    
    const homeTeamPlayerStats = playerStats.filter(stat => stat.player.teamId === homeTeamId);
    const awayTeamPlayerStats = playerStats.filter(stat => stat.player.teamId === awayTeamId);
    
    // Calculate aggregated stats
    const calculateAggregatedStats = (teamStats) => {
      if (!teamStats.length) return null;
      
      return {
        points: teamStats.reduce((sum, stat) => sum + stat.stats.points, 0),
        rebounds: teamStats.reduce((sum, stat) => sum + stat.stats.rebounds, 0),
        assists: teamStats.reduce((sum, stat) => sum + stat.stats.assists, 0),
        steals: teamStats.reduce((sum, stat) => sum + stat.stats.steals, 0),
        blocks: teamStats.reduce((sum, stat) => sum + stat.stats.blocks, 0),
        turnovers: teamStats.reduce((sum, stat) => sum + stat.stats.turnovers, 0),
        fieldGoalPercentage: teamStats.reduce((sum, stat) => sum + stat.stats.fieldGoalPercentage, 0) / teamStats.length,
        threePointPercentage: teamStats.reduce((sum, stat) => sum + stat.stats.threePointerPercentage, 0) / teamStats.length
      };
    };
    
    return {
      homeTeamStats: calculateAggregatedStats(homeTeamPlayerStats),
      awayTeamStats: calculateAggregatedStats(awayTeamPlayerStats)
    };
  };
  
  const { homeTeamStats, awayTeamStats } = calculateTeamStats();
  
  // Check if game is live
  const isLive = selectedGame?.status.toLowerCase().includes('live') || 
                 selectedGame?.status.toLowerCase().includes('in progress');

  if (!selectedGame) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-betting-dark rounded-lg shadow-lg overflow-hidden">
      {/* Game header */}
      <div className="bg-primary p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Game Details</h2>
          {isLive && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-win text-white">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-white animate-pulse"></span>
              LIVE
            </span>
          )}
        </div>
        <p className="text-gray-300 text-sm mt-1">
          {new Date(selectedGame.date).toLocaleDateString()} • {selectedGame.status}
        </p>
      </div>
      
      {/* Game score */}
      <div className="p-6 bg-betting-highlight">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-white">{selectedGame.awayTeam.name.charAt(0)}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{selectedGame.awayTeam.name}</h3>
            <p className="text-sm text-gray-400">{selectedGame.awayTeam.city}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <span className="text-4xl font-bold text-white">{selectedGame.awayTeam.score}</span>
              <span className="text-gray-400 mx-4">-</span>
              <span className="text-4xl font-bold text-white">{selectedGame.homeTeam.score}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {selectedGame.period > 0 ? `Quarter ${selectedGame.period}` : ''} {selectedGame.time}
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-white">{selectedGame.homeTeam.name.charAt(0)}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{selectedGame.homeTeam.name}</h3>
            <p className="text-sm text-gray-400">{selectedGame.homeTeam.city}</p>
          </div>
        </div>
      </div>
      
      {/* Betting odds */}
      {(selectedGame.odds.moneyline.home !== null || selectedGame.odds.spread.homePoint !== null) && (
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">Betting Odds</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-betting-card p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Moneyline</h4>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-400">{selectedGame.awayTeam.name}</p>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.odds.moneyline.away != null && selectedGame.odds.moneyline.away > 0 ? '+' : ''}{selectedGame.odds.moneyline.away ?? '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{selectedGame.homeTeam.name}</p>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.odds.moneyline.home != null && selectedGame.odds.moneyline.home > 0 ? '+' : ''}{selectedGame.odds.moneyline.home ?? '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-betting-card p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Spread</h4>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-400">{selectedGame.awayTeam.name}</p>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.odds.spread.awayPoint != null && selectedGame.odds.spread.awayPoint > 0 ? '+' : ''}{selectedGame.odds.spread.awayPoint ?? '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{selectedGame.homeTeam.name}</p>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.odds.spread.homePoint != null && selectedGame.odds.spread.homePoint > 0 ? '+' : ''}{selectedGame.odds.spread.homePoint ?? '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-betting-card p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Total</h4>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-400">Over</p>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.odds.total.over || '-'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Line</p>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.odds.total.point || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Under</p>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.odds.total.under || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Odds last updated: {selectedGame.odds.moneyline.updated ? new Date(selectedGame.odds.moneyline.updated).toLocaleString() : 'N/A'}
          </p>
        </div>
      )}
      
      {/* Game visualizations */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score timeline */}
          {scoreTimeline.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GameScoreTimeline
                gameId={parseInt(selectedGame.id, 10)}
                homeTeam={selectedGame.homeTeam}
                awayTeam={selectedGame.awayTeam}
                scoreTimeline={scoreTimeline}
                isLive={isLive || false}
              />
            </motion.div>
          )}
          
          {/* Team stats comparison */}
          {homeTeamStats && awayTeamStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <TeamStatsRadarChart
                gameId={parseInt(selectedGame.id, 10)}
                homeTeam={selectedGame.homeTeam}
                awayTeam={selectedGame.awayTeam}
                homeTeamStats={homeTeamStats}
                awayTeamStats={awayTeamStats}
              />
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Player statistics */}
      <div className="p-4 border-t border-gray-700">
        <HybridPlayerStatsList gameId={parseInt(selectedGame.id)} />
      </div>
    </div>
  );
};

export default HybridGameDetail;
