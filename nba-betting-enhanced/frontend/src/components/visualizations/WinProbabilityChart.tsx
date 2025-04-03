// src/components/visualizations/WinProbabilityChart.tsx - Real-time win probability chart

import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useSocket } from '../../contexts/SocketContext';
import { motion } from 'framer-motion';

interface WinProbabilityPoint {
  timestamp: string;
  homeWinProbability: number;
  awayWinProbability: number;
  gameTime: string;
}

interface WinProbabilityChartProps {
  gameId: string;
  homeTeam: string;
  homeColor?: string;
  awayTeam: string;
  awayColor?: string;
  initialData?: WinProbabilityPoint[];
  homeWinProbability?: number;
  awayWinProbability?: number;
}

const WinProbabilityChart: React.FC<WinProbabilityChartProps> = ({
  gameId,
  homeTeam,
  homeColor = '#1E40AF', // Default blue
  awayTeam,
  awayColor = '#DC2626', // Default red
  initialData = [],
  homeWinProbability,
  awayWinProbability
}) => {
  // Initialize with default data if no initialData is provided
  const [data, setData] = useState<WinProbabilityPoint[]>(() => {
    // If initialData is provided, use it
    if (initialData && initialData.length > 0) {
      return initialData;
    } 
    // If homeWinProbability is provided, create initial data point
    else if (homeWinProbability !== undefined) {
      // Calculate awayWinProbability if not provided (ensuring they sum to 1)
      // Using a safer calculation that handles edge cases
      const homeProb = Math.max(0, Math.min(1, homeWinProbability)); // Ensure between 0 and 1
      const awayProb = awayWinProbability !== undefined 
        ? Math.max(0, Math.min(1, awayWinProbability)) // Ensure between 0 and 1
        : Math.max(0, 1 - homeProb); // Calculate based on homeProb
      
      // Create initial data points to show a trend
      return [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          homeWinProbability: 0.5, // Start at 50/50
          awayWinProbability: 0.5,
          gameTime: 'Start'
        },
        {
          timestamp: new Date().toISOString(),
          homeWinProbability: homeProb,
          awayWinProbability: awayProb,
          gameTime: 'Current'
        }
      ];
    }
    // Fallback to empty array if no data is provided
    return [];
  });
  
  const { gameSocket } = useSocket();

  useEffect(() => {
    if (!gameSocket) return;

    // Join game room
    gameSocket.emit('join_game', gameId);

    // Listen for prediction updates
    const handlePredictionUpdate = (update: any) => {
      if (update && update.gameId === gameId) {
        // Improved error handling for update data
        const timestamp = update.timestamp || new Date().toISOString();
        
        // Safely access nested properties with fallbacks
        const homeProb = update.predictions && 
                         update.predictions.winProbability && 
                         update.predictions.winProbability.home !== undefined
                         ? Math.max(0, Math.min(1, update.predictions.winProbability.home))
                         : 0.5;
        
        const awayProb = update.predictions && 
                         update.predictions.winProbability && 
                         update.predictions.winProbability.away !== undefined
                         ? Math.max(0, Math.min(1, update.predictions.winProbability.away))
                         : 0.5;
        
        // Ensure probabilities sum to 1 if they're close
        const sum = homeProb + awayProb;
        const normalizedHomeProb = sum > 0 ? homeProb / sum : 0.5;
        const normalizedAwayProb = sum > 0 ? awayProb / sum : 0.5;
        
        const gameTime = update.period && update.timeRemaining 
          ? formatGameTime(update.period, update.timeRemaining) 
          : 'Current';

        const newPoint: WinProbabilityPoint = {
          timestamp,
          homeWinProbability: normalizedHomeProb,
          awayWinProbability: normalizedAwayProb,
          gameTime
        };

        setData(prevData => [...prevData, newPoint]);
      }
    };

    gameSocket.on('prediction_update', handlePredictionUpdate);

    // Clean up on unmount
    return () => {
      gameSocket.off('prediction_update', handlePredictionUpdate);
      gameSocket.emit('leave_game', gameId);
    };
  }, [gameSocket, gameId]);

  // Update data if homeWinProbability or awayWinProbability props change
  useEffect(() => {
    if (homeWinProbability !== undefined) {
      // Calculate awayWinProbability if not provided (ensuring they sum to 1)
      // Using a safer calculation that handles edge cases
      const homeProb = Math.max(0, Math.min(1, homeWinProbability)); // Ensure between 0 and 1
      const awayProb = awayWinProbability !== undefined 
        ? Math.max(0, Math.min(1, awayWinProbability)) // Ensure between 0 and 1
        : Math.max(0, 1 - homeProb); // Calculate based on homeProb
      
      const newPoint: WinProbabilityPoint = {
        timestamp: new Date().toISOString(),
        homeWinProbability: homeProb,
        awayWinProbability: awayProb,
        gameTime: 'Current'
      };

      // If we already have data, update the last point or add a new one
      setData(prevData => {
        if (!prevData || prevData.length === 0) {
          // If no data, create initial points to show a trend
          return [
            {
              timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
              homeWinProbability: 0.5, // Start at 50/50
              awayWinProbability: 0.5,
              gameTime: 'Start'
            },
            newPoint
          ];
        } else {
          // Replace the last point if it's from the same timestamp (within 1 second)
          const lastPoint = prevData[prevData.length - 1];
          if (!lastPoint) return [...prevData, newPoint]; // Safety check
          
          try {
            const timeDiff = Math.abs(
              new Date(lastPoint.timestamp).getTime() - 
              new Date(newPoint.timestamp).getTime()
            );
            
            if (timeDiff < 1000 && lastPoint.gameTime === 'Current') {
              return [...prevData.slice(0, -1), newPoint];
            } else {
              return [...prevData, newPoint];
            }
          } catch (error) {
            // If there's an error parsing dates, just append the new point
            return [...prevData, newPoint];
          }
        }
      });
    }
  }, [homeWinProbability, awayWinProbability]);

  // Format game time (e.g., "Q3 5:42")
  const formatGameTime = (period: number, timeRemaining: number): string => {
    // Ensure inputs are valid numbers
    const validPeriod = isNaN(period) ? 1 : Math.max(1, period);
    const validTimeRemaining = isNaN(timeRemaining) ? 0 : Math.max(0, timeRemaining);
    
    const minutes = Math.floor(validTimeRemaining / 60);
    const seconds = Math.floor(validTimeRemaining % 60);
    const periodLabel = validPeriod <= 4 ? `Q${validPeriod}` : `OT${validPeriod - 4}`;
    return `${periodLabel} ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Format tooltip values
  const formatProbability = (value: number) => `${(value * 100).toFixed(1)}%`;

  // If no data, show a loading state
  if (!data || data.length === 0) {
    return (
      <motion.div 
        className="bg-gray-800 rounded-lg p-4 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-bold mb-4 text-center text-white">Win Probability</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">Loading probability data...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-gray-800 rounded-lg p-4 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-bold mb-4 text-center text-white">Win Probability</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="gameTime" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              tickFormatter={formatProbability}
              domain={[0, 1]}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip 
              formatter={formatProbability}
              contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563', color: '#F9FAFB' }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend wrapperStyle={{ color: '#F9FAFB' }} />
            <Line
              type="monotone"
              dataKey="homeWinProbability"
              name={homeTeam}
              stroke={homeColor}
              strokeWidth={2}
              dot={{ fill: homeColor, strokeWidth: 1, r: 4 }}
              activeDot={{ r: 6, fill: homeColor }}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="awayWinProbability"
              name={awayTeam}
              stroke={awayColor}
              strokeWidth={2}
              dot={{ fill: awayColor, strokeWidth: 1, r: 4 }}
              activeDot={{ r: 6, fill: awayColor }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <div>Game Start</div>
        <div>Current</div>
      </div>
    </motion.div>
  );
};

export default WinProbabilityChart;
