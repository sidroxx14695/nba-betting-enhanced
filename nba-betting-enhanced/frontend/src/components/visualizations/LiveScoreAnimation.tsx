import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../contexts/SocketContext';

interface LiveScoreAnimationProps {
  gameId: string;
  initialHomeScore: number;
  initialAwayScore: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamColor?: string;
  awayTeamColor?: string;
}

const LiveScoreAnimation: React.FC<LiveScoreAnimationProps> = ({
  gameId,
  initialHomeScore,
  initialAwayScore,
  homeTeam,
  awayTeam,
  homeTeamColor = '#1E40AF', // Default primary color
  awayTeamColor = '#D97706', // Default secondary color
}) => {
  // State for scores
  const [homeScore, setHomeScore] = useState<number>(initialHomeScore);
  const [awayScore, setAwayScore] = useState<number>(initialAwayScore);
  const [prevHomeScore, setPrevHomeScore] = useState<number>(initialHomeScore);
  const [prevAwayScore, setPrevAwayScore] = useState<number>(initialAwayScore);
  const [homeScoreChanged, setHomeScoreChanged] = useState<boolean>(false);
  const [awayScoreChanged, setAwayScoreChanged] = useState<boolean>(false);
  const [scoringTeam, setScoringTeam] = useState<string | null>(null);
  const [scoringPoints, setScoringPoints] = useState<number>(0);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  
  // Get socket context
  const { gameSocket } = useSocket();
  
  // Listen for score updates
  useEffect(() => {
    if (!gameSocket) return;
    
    // Listen for score updates
    gameSocket.on(`game:${gameId}:score_update`, (data: any) => {
      // Update scores
      setPrevHomeScore(homeScore);
      setPrevAwayScore(awayScore);
      setHomeScore(data.homeScore);
      setAwayScore(data.awayScore);
      
      // Determine which team scored and how many points
      if (data.homeScore > homeScore) {
        setHomeScoreChanged(true);
        setScoringTeam(homeTeam);
        setScoringPoints(data.homeScore - homeScore);
        setShowAnimation(true);
      } else if (data.awayScore > awayScore) {
        setAwayScoreChanged(true);
        setScoringTeam(awayTeam);
        setScoringPoints(data.awayScore - awayScore);
        setShowAnimation(true);
      }
      
      // Reset score change indicators after animation
      setTimeout(() => {
        setHomeScoreChanged(false);
        setAwayScoreChanged(false);
      }, 2000);
      
      // Hide scoring animation after delay
      setTimeout(() => {
        setShowAnimation(false);
      }, 3000);
    });
    
    return () => {
      gameSocket.off(`game:${gameId}:score_update`);
    };
  }, [gameSocket, gameId, homeScore, awayScore, homeTeam, awayTeam]);
  
  // Animation variants
  const scoreVariants = {
    unchanged: { scale: 1 },
    changed: { 
      scale: [1, 1.2, 1],
      transition: { duration: 0.5 }
    }
  };
  
  const scoringAnimationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="relative">
      {/* Score display */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-400">{homeTeam}</span>
          <motion.div
            className={`text-3xl font-bold ${homeScoreChanged ? 'text-shadow' : ''}`}
            style={{ 
              color: homeScoreChanged ? homeTeamColor : 'white',
              textShadow: homeScoreChanged ? `0 0 10px ${homeTeamColor}` : 'none'
            }}
            variants={scoreVariants}
            animate={homeScoreChanged ? 'changed' : 'unchanged'}
          >
            {homeScore}
          </motion.div>
        </div>
        
        <div className="text-gray-400 mx-4">-</div>
        
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-400">{awayTeam}</span>
          <motion.div
            className={`text-3xl font-bold ${awayScoreChanged ? 'text-shadow' : ''}`}
            style={{ 
              color: awayScoreChanged ? awayTeamColor : 'white',
              textShadow: awayScoreChanged ? `0 0 10px ${awayTeamColor}` : 'none'
            }}
            variants={scoreVariants}
            animate={awayScoreChanged ? 'changed' : 'unchanged'}
          >
            {awayScore}
          </motion.div>
        </div>
      </div>
      
      {/* Scoring animation */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            className="absolute top-0 left-0 w-full flex justify-center"
            style={{ transform: 'translateY(-100%)' }}
            variants={scoringAnimationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div 
              className="px-4 py-2 rounded-full text-white font-bold"
              style={{ 
                backgroundColor: scoringTeam === homeTeam ? homeTeamColor : awayTeamColor,
                boxShadow: `0 0 15px ${scoringTeam === homeTeam ? homeTeamColor : awayTeamColor}`
              }}
            >
              {scoringTeam} +{scoringPoints}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveScoreAnimation;
