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
    if (initialData.length > 0) {
      return initialData;
    } 
    // If homeWinProbability is provided, create initial data point
    else if (homeWinProbability !== undefined) {
      // Calculate awayWinProbability if not provided (assuming they sum to 1)
      const awayProb = awayWinProbability !== undefined ? 
        awayWinProbability : 
        (1 - homeWinProbability);
      
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
          homeWinProbability: homeWinProbability,
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
      if (update.gameId === gameId) {
        const newPoint: WinProbabilityPoint = {
          timestamp: update.timestamp || new Date().toISOString(),
          homeWinProbability: update.predictions?.winProbability?.home || 0.5,
          awayWinProbability: update.predictions?.winProbability?.away || 0.5,
          gameTime: update.period && update.timeRemaining ? 
            formatGameTime(update.period, update.timeRemaining) : 
            'Current'
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
      // Calculate awayWinProbability if not provided (assuming they sum to 1)
      const awayProb = awayWinProbability !== undefined ? 
        awayWinProbability : 
        (1 - homeWinProbability);
      
      const newPoint: WinProbabilityPoint = {
        timestamp: new Date().toISOString(),
        homeWinProbability: homeWinProbability,
        awayWinProbability: awayProb,
        gameTime: 'Current'
      };

      // If we already have data, update the last point or add a new one
      setData(prevData => {
        if (prevData.length === 0) {
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
          const timeDiff = Math.abs(new Date(lastPoint.timestamp).getTime() - new Date(newPoint.timestamp).getTime());
          
          if (timeDiff < 1000 && lastPoint.gameTime === 'Current') {
            return [...prevData.slice(0, -1), newPoint];
          } else {
            return [...prevData, newPoint];
          }
        }
      });
    }
  }, [homeWinProbability, awayWinProbability]);

  // Format game time (e.g., "Q3 5:42")
  const formatGameTime = (period: number, timeRemaining: number): string => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = Math.floor(timeRemaining % 60);
    const periodLabel = period <= 4 ? `Q${period}` : `OT${period - 4}`;
    return `${periodLabel} ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Format tooltip values
  const formatProbability = (value: number) => `${(value * 100).toFixed(1)}%`;

  // If no data, show a loading state
  if (data.length === 0) {
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
