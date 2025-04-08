// src/components/players/HybridPlayerStatsList.tsx - Updated player stats component using hybrid API data

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchStatsByGame } from '../../store/slices/hybridDataSlice';
import { motion } from 'framer-motion';

interface HybridPlayerStatsListProps {
  gameId: number;
}

const HybridPlayerStatsList: React.FC<HybridPlayerStatsListProps> = ({ gameId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { playerStats, loading, error } = useSelector((state: RootState) => state.hybridData);
  const [activeTeam, setActiveTeam] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
    key: 'points',
    direction: 'descending'
  });

  // Fetch player stats on component mount
  useEffect(() => {
    if (gameId) {
      dispatch(fetchStatsByGame(gameId));
    }
  }, [dispatch, gameId]);

  // Get unique teams from player stats
  const teams = React.useMemo(() => {
    const teamIds = new Set<number>();
    const teamData: { id: number; name: string }[] = [];
    
    playerStats.forEach(stat => {
      if (!teamIds.has(stat.player.teamId)) {
        teamIds.add(stat.player.teamId);
        teamData.push({
          id: stat.player.teamId,
          name: stat.player.teamName
        });
      }
    });
    
    return teamData;
  }, [playerStats]);

  // Set first team as active when teams are loaded
  useEffect(() => {
    if (teams.length > 0 && activeTeam === null) {
      setActiveTeam(teams[0].id);
    }
  }, [teams, activeTeam]);

  // Filter stats by active team
  const filteredStats = React.useMemo(() => {
    if (activeTeam === null) return playerStats;
    return playerStats.filter(stat => stat.player.teamId === activeTeam);
  }, [playerStats, activeTeam]);

  // Sort stats by selected column
  const sortedStats = React.useMemo(() => {
    const sortableStats = [...filteredStats];
    
    sortableStats.sort((a, b) => {
      let aValue, bValue;
      
      // Handle nested properties
      if (sortConfig.key.includes('.')) {
        const [parent, child] = sortConfig.key.split('.');
        aValue = a[parent][child];
        bValue = b[parent][child];
      } else {
        aValue = a.stats[sortConfig.key];
        bValue = b.stats[sortConfig.key];
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    return sortableStats;
  }, [filteredStats, sortConfig]);

  // Handle sort request
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort direction indicator
  const getSortDirectionIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div className="bg-betting-dark rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold text-white mb-4">Player Statistics</h2>
      
      {/* Team selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {teams.map(team => (
          <button
            key={team.id}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTeam === team.id 
                ? 'bg-primary text-white' 
                : 'bg-betting-card text-gray-300 hover:bg-betting-highlight'
            }`}
            onClick={() => setActiveTeam(team.id)}
          >
            {team.name}
          </button>
        ))}
      </div>
      
      {loading.stats ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error.stats ? (
        <div className="bg-betting-card p-4 rounded-lg text-status-loss">
          Error loading player statistics: {error.stats}
        </div>
      ) : sortedStats.length === 0 ? (
        <div className="bg-betting-card p-4 rounded-lg text-gray-400">
          No player statistics available for this game.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-betting-highlight">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-betting-card"
                  onClick={() => requestSort('minutes')}
                >
                  MIN {getSortDirectionIndicator('minutes')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-betting-card"
                  onClick={() => requestSort('points')}
                >
                  PTS {getSortDirectionIndicator('points')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-betting-card"
                  onClick={() => requestSort('rebounds')}
                >
                  REB {getSortDirectionIndicator('rebounds')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-betting-card"
                  onClick={() => requestSort('assists')}
                >
                  AST {getSortDirectionIndicator('assists')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-betting-card"
                  onClick={() => requestSort('steals')}
                >
                  STL {getSortDirectionIndicator('steals')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-betting-card"
                  onClick={() => requestSort('blocks')}
                >
                  BLK {getSortDirectionIndicator('blocks')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-betting-card"
                  onClick={() => requestSort('fieldGoalPercentage')}
                >
                  FG% {getSortDirectionIndicator('fieldGoalPercentage')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-betting-card"
                  onClick={() => requestSort('threePointerPercentage')}
                >
                  3P% {getSortDirectionIndicator('threePointerPercentage')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat, index) => (
                <motion.tr 
                  key={stat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={index % 2 === 0 ? 'bg-betting-card' : 'bg-betting-dark'}
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {stat.player.firstName} {stat.player.lastName}
                    <span className="text-xs text-gray-400 ml-1">
                      {stat.player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3">{stat.stats.minutes}</td>
                  <td className="px-4 py-3 font-medium text-white">{stat.stats.points}</td>
                  <td className="px-4 py-3">{stat.stats.rebounds}</td>
                  <td className="px-4 py-3">{stat.stats.assists}</td>
                  <td className="px-4 py-3">{stat.stats.steals}</td>
                  <td className="px-4 py-3">{stat.stats.blocks}</td>
                  <td className="px-4 py-3">
                    {stat.stats.fieldGoalsMade}/{stat.stats.fieldGoalsAttempted}
                    <span className="ml-1 text-xs">
                      ({(stat.stats.fieldGoalPercentage * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {stat.stats.threePointersMade}/{stat.stats.threePointersAttempted}
                    <span className="ml-1 text-xs">
                      ({(stat.stats.threePointerPercentage * 100).toFixed(1)}%)
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HybridPlayerStatsList;
