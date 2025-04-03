import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  Cell
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
  homeColor = '#1E40AF', // Default primary color
  awayTeam,
  awayColor = '#D97706', // Default secondary color
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
        <div className="bg-betting-card p-4 border border-gray-700 rounded-lg shadow-lg">
          <p className="text-white font-medium text-center mb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              if (!entry) return null; // Safety check
              
              const isActual = entry.dataKey && entry.dataKey.includes('actual');
              const teamName = entry.dataKey && entry.dataKey.includes('home') ? homeTeam : awayTeam;
              const color = entry.dataKey && entry.dataKey.includes('home') ? homeColor : awayColor;
              
              return (
                <div key={`item-${index}`} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                    <span className="text-gray-300">{teamName}</span>
                  </div>
                  <span className="font-medium" style={{ color }}>
                    {entry.value} pts {isActual ? '(Actual)' : '(Predicted)'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate final scores for display
  const finalPrediction = data[data.length - 1];
  const finalHomeScore = finalPrediction ? finalPrediction.homeScore : 0;
  const finalAwayScore = finalPrediction ? finalPrediction.awayScore : 0;
  const homeWinning = finalHomeScore > finalAwayScore;
  const awayWinning = finalAwayScore > finalHomeScore;

  return (
    <motion.div 
      className="card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Score Prediction</h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: homeColor }}></div>
            <span className="text-sm text-gray-300">{homeTeam}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: awayColor }}></div>
            <span className="text-sm text-gray-300">{awayTeam}</span>
          </div>
        </div>
      </div>
      
      {/* Final score prediction display */}
      <div className="bg-betting-highlight bg-opacity-30 rounded-lg p-3 mb-4">
        <div className="text-center text-sm text-gray-400 mb-1">Predicted Final Score</div>
        <div className="flex justify-center items-center">
          <div className={`text-xl font-bold ${homeWinning ? 'text-status-win' : 'text-white'}`}>
            {finalHomeScore}
          </div>
          <div className="text-lg mx-2 text-gray-400">-</div>
          <div className={`text-xl font-bold ${awayWinning ? 'text-status-win' : 'text-white'}`}>
            {finalAwayScore}
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-1">
          {homeWinning ? `${homeTeam} wins by ${finalHomeScore - finalAwayScore}` : 
           awayWinning ? `${awayTeam} wins by ${finalAwayScore - finalHomeScore}` : 
           'Predicted tie game'}
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="homeScoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={homeColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={homeColor} stopOpacity={0.4}/>
              </linearGradient>
              <linearGradient id="awayScoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={awayColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={awayColor} stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="quarter" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Predicted scores */}
            <Bar 
              dataKey="homeScore" 
              name={`${homeTeam} (Predicted)`} 
              fill="url(#homeScoreGradient)" 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Bar 
              dataKey="awayScore" 
              name={`${awayTeam} (Predicted)`} 
              fill="url(#awayScoreGradient)" 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            
            {/* Actual scores */}
            <Bar 
              dataKey="actualHomeScore" 
              name={`${homeTeam} (Actual)`} 
              fill={homeColor}
              radius={[4, 4, 0, 0]}
              stackId="actual"
            />
            <Bar 
              dataKey="actualAwayScore" 
              name={`${awayTeam} (Actual)`} 
              fill={awayColor}
              radius={[4, 4, 0, 0]}
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
                fill: '#FFFFFF',
                fontSize: 12
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
