// src/components/visualizations/ScorePredictionChart.tsx
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { useSocket } from './src/contexts/SocketContext';
import { motion } from 'framer-motion';

interface ScorePredictionPoint {
  quarter: string;
  homeScore: number;
  awayScore: number;
  actualHomeScore?: number;
  actualAwayScore?: number;
}

interface ScorePredictionChartProps {
  gameId: string;
  homeTeam: string;
  homeColor?: string;
  awayTeam: string;
  awayColor?: string;
  currentHomeScore: number;
  currentAwayScore: number;
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  currentQuarter?: number;
}

const ScorePredictionChart: React.FC<ScorePredictionChartProps> = ({
  gameId,
  homeTeam,
  homeColor = '#1E40AF', // Default blue
  awayTeam,
  awayColor = '#DC2626', // Default red
  currentHomeScore,
  currentAwayScore,
  predictedHomeScore,
  predictedAwayScore,
  currentQuarter = 1
}) => {
  // Generate prediction data based on current scores and predicted final scores
  const generatePredictionData = (): ScorePredictionPoint[] => {
    const data: ScorePredictionPoint[] = [];
    
    // If we don't have predicted scores, use simple linear projection
    const finalHomeScore = predictedHomeScore || Math.round(currentHomeScore * (4 / currentQuarter));
    const finalAwayScore = predictedAwayScore || Math.round(currentAwayScore * (4 / currentQuarter));
    
    // Calculate score progression
    for (let q = 1; q <= 4; q++) {
      const quarterLabel = `Q${q}`;
      
      // For quarters that have passed or current quarter, use actual scores
      if (q < currentQuarter) {
        // Estimate past quarters (simplified)
        const ratio = q / 4;
        data.push({
          quarter: quarterLabel,
          homeScore: Math.round(finalHomeScore * ratio),
          awayScore: Math.round(finalAwayScore * ratio),
          actualHomeScore: Math.round(currentHomeScore * (q / currentQuarter)),
          actualAwayScore: Math.round(currentAwayScore * (q / currentQuarter))
        });
      } else if (q === currentQuarter) {
        // Current quarter - use actual scores
        data.push({
          quarter: quarterLabel,
          homeScore: Math.round(finalHomeScore * (q / 4)),
          awayScore: Math.round(finalAwayScore * (q / 4)),
          actualHomeScore: currentHomeScore,
          actualAwayScore: currentAwayScore
        });
      } else {
        // Future quarters - only predictions
        const ratio = q / 4;
        data.push({
          quarter: quarterLabel,
          homeScore: Math.round(finalHomeScore * ratio),
          awayScore: Math.round(finalAwayScore * ratio)
        });
      }
    }
    
    // Add final prediction
    data.push({
      quarter: 'Final',
      homeScore: finalHomeScore,
      awayScore: finalAwayScore
    });
    
    return data;
  };

  const [data, setData] = useState<ScorePredictionPoint[]>(generatePredictionData());
  const { gameSocket } = useSocket();

  useEffect(() => {
    // Update data when props change
    setData(generatePredictionData());
  }, [currentHomeScore, currentAwayScore, predictedHomeScore, predictedAwayScore, currentQuarter]);

  useEffect(() => {
    if (!gameSocket) return;

    // Join game room
    gameSocket.emit('join_game', gameId);

    // Listen for score updates
    const handleScoreUpdate = (update: any) => {
      if (update.gameId === gameId) {
        // Update the chart with new data
        setData(generatePredictionData());
      }
    };

    gameSocket.on('score_update', handleScoreUpdate);

    // Clean up on unmount
    return () => {
      gameSocket.off('score_update', handleScoreUpdate);
      gameSocket.emit('leave_game', gameId);
    };
  }, [gameSocket, gameId]);

  // Format tooltip values
  const formatScore = (value: number) => `${value} pts`;

  // Custom tooltip to show both predicted and actual scores
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow-lg">
          <p className="text-gray-300 font-medium">{label}</p>
          <div className="mt-1">
            {payload.map((entry: any, index: number) => {
              const isActual = entry.dataKey.includes('actual');
              const teamName = entry.dataKey.includes('home') ? homeTeam : awayTeam;
              const color = entry.dataKey.includes('home') ? homeColor : awayColor;
              
              return (
                <p key={`item-${index}`} style={{ color }}>
                  {teamName}: {entry.value} pts {isActual ? '(Actual)' : '(Predicted)'}
                </p>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="bg-gray-800 rounded-lg p-4 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-bold mb-4 text-center text-white">Score Prediction</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="quarter" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#F9FAFB' }} />
            
            {/* Predicted scores */}
            <Bar 
              dataKey="homeScore" 
              name={`${homeTeam} (Predicted)`} 
              fill={homeColor} 
              opacity={0.7}
            />
            <Bar 
              dataKey="awayScore" 
              name={`${awayTeam} (Predicted)`} 
              fill={awayColor} 
              opacity={0.7}
            />
            
            {/* Actual scores */}
            <Bar 
              dataKey="actualHomeScore" 
              name={`${homeTeam} (Actual)`} 
              fill={homeColor} 
              stackId="actual"
            />
            <Bar 
              dataKey="actualAwayScore" 
              name={`${awayTeam} (Actual)`} 
              fill={awayColor} 
              stackId="actual"
            />
            
            {/* Reference line for current quarter */}
            <ReferenceLine 
              x={`Q${currentQuarter}`} 
              stroke="#FFFFFF" 
              strokeDasharray="3 3" 
              label={{ 
                value: 'Current', 
                position: 'top', 
                fill: '#FFFFFF' 
              }} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <div>Current</div>
        <div>Predicted Final</div>
      </div>
    </motion.div>
  );
};

export default ScorePredictionChart;
