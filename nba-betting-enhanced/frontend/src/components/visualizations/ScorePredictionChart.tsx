// src/components/visualizations/ScorePredictionChart.tsx
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { useSocket } from '../../contexts/SocketContext';
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
    
    // Ensure currentQuarter is valid (at least 1)
    const validQuarter = Math.max(1, currentQuarter || 1);
    
    // Ensure scores are valid numbers
    const validHomeScore = isNaN(currentHomeScore) ? 0 : Math.max(0, currentHomeScore);
    const validAwayScore = isNaN(currentAwayScore) ? 0 : Math.max(0, currentAwayScore);
    
    // If we don't have predicted scores, use improved projection algorithm
    // This uses a weighted approach that accounts for game momentum
    let finalHomeScore, finalAwayScore;
    
    if (predictedHomeScore !== undefined && !isNaN(predictedHomeScore)) {
      finalHomeScore = Math.max(0, predictedHomeScore);
    } else {
      // More sophisticated projection based on quarter
      // Later quarters get more weight as they're more predictive
      const quarterWeight = Math.min(validQuarter, 4) / 4; // 0.25 to 1.0
      const baseProjection = validHomeScore * (4 / validQuarter);
      const conservativeProjection = validHomeScore + (validHomeScore / validQuarter) * (4 - validQuarter);
      
      // Blend between conservative and linear projection based on quarter
      finalHomeScore = Math.round(
        (baseProjection * quarterWeight) + (conservativeProjection * (1 - quarterWeight))
      );
    }
    
    if (predictedAwayScore !== undefined && !isNaN(predictedAwayScore)) {
      finalAwayScore = Math.max(0, predictedAwayScore);
    } else {
      // Same improved algorithm for away score
      const quarterWeight = Math.min(validQuarter, 4) / 4;
      const baseProjection = validAwayScore * (4 / validQuarter);
      const conservativeProjection = validAwayScore + (validAwayScore / validQuarter) * (4 - validQuarter);
      
      finalAwayScore = Math.round(
        (baseProjection * quarterWeight) + (conservativeProjection * (1 - quarterWeight))
      );
    }
    
    // Calculate score progression
    for (let q = 1; q <= 4; q++) {
      const quarterLabel = `Q${q}`;
      
      // For quarters that have passed or current quarter, use actual scores
      if (q < validQuarter) {
        // Estimate past quarters with improved algorithm
        // This assumes scoring rate increases slightly in later quarters
        const quarterRatio = q / 4;
        const progressiveRatio = 0.8 * quarterRatio + 0.2 * (q / validQuarter);
        
        data.push({
          quarter: quarterLabel,
          homeScore: Math.round(finalHomeScore * quarterRatio),
          awayScore: Math.round(finalAwayScore * quarterRatio),
          actualHomeScore: Math.round(validHomeScore * progressiveRatio),
          actualAwayScore: Math.round(validAwayScore * progressiveRatio)
        });
      } else if (q === validQuarter) {
        // Current quarter - use actual scores
        data.push({
          quarter: quarterLabel,
          homeScore: Math.round(finalHomeScore * (q / 4)),
          awayScore: Math.round(finalAwayScore * (q / 4)),
          actualHomeScore: validHomeScore,
          actualAwayScore: validAwayScore
        });
      } else {
        // Future quarters - only predictions
        // Use slightly progressive scoring rate for future quarters
        const baseRatio = q / 4;
        const progressiveRatio = baseRatio + (q - validQuarter) * 0.05; // Slight increase for later quarters
        
        data.push({
          quarter: quarterLabel,
          homeScore: Math.round(finalHomeScore * progressiveRatio),
          awayScore: Math.round(finalAwayScore * progressiveRatio)
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
      if (update && update.gameId === gameId) {
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
              if (!entry) return null; // Safety check
              
              const isActual = entry.dataKey && entry.dataKey.includes('actual');
              const teamName = entry.dataKey && entry.dataKey.includes('home') ? homeTeam : awayTeam;
              const color = entry.dataKey && entry.dataKey.includes('home') ? homeColor : awayColor;
              
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
              x={`Q${Math.max(1, currentQuarter || 1)}`} 
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
