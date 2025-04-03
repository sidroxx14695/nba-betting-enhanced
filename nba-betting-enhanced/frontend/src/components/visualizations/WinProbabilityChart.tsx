import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
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
  homeColor = '#1E40AF', // Default primary color
  awayTeam,
  awayColor = '#D97706', // Default secondary color
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

  // Calculate current win probabilities for display
  const currentHomeProb = data.length > 0 ? data[data.length - 1].homeWinProbability : 0.5;
  const currentAwayProb = data.length > 0 ? data[data.length - 1].awayWinProbability : 0.5;

  // If no data, show a loading state
  if (!data || data.length === 0) {
    return (
      <motion.div 
        className="card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-bold mb-4 text-center text-white">Win Probability</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-400">Loading probability data...</p>
          </div>
        </div>
      </motion.div>
    ) ;
  }

  return (
    <motion.div 
      className="card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Win Probability</h3>
        
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: homeColor }}></div>
            <span className="text-sm text-gray-300">{homeTeam}: {formatProbability(currentHomeProb)}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: awayColor }}></div>
            <span className="text-sm text-gray-300">{awayTeam}: {formatProbability(currentAwayProb)}</span>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="homeColorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={homeColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={homeColor} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="awayColorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={awayColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={awayColor} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="gameTime" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatProbability}
              domain={[0, 1]}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip 
              formatter={formatProbability}
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                borderColor: '#334155', 
                color: '#F9FAFB',
                borderRadius: '0.375rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#F9FAFB', fontWeight: 'bold', marginBottom: '0.5rem' }}
              itemStyle={{ padding: '0.25rem 0' }}
            />
            <Area
              type="monotone"
              dataKey="homeWinProbability"
              name={homeTeam}
              stroke={homeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#homeColorGradient)"
              activeDot={{ r: 6, fill: homeColor, strokeWidth: 1 }}
              isAnimationActive={true}
            />
            <Area
              type="monotone"
              dataKey="awayWinProbability"
              name={awayTeam}
              stroke={awayColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#awayColorGradient)"
              activeDot={{ r: 6, fill: awayColor, strokeWidth: 1 }}
              isAnimationActive={true}
            />
          </AreaChart>
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
