import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParlayRecommendationCardProps {
  parlayLegs: {
    id: string;
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    betType: string;
    selection: string;
    odds: number;
    confidence: number;
  }[];
  potentialWinnings: number;
  totalOdds: number;
  riskLevel: 'low' | 'medium' | 'high';
  onSelectLeg?: (legId: string, selected: boolean) => void;
}

const ParlayRecommendationCard: React.FC<ParlayRecommendationCardProps> = ({
  parlayLegs,
  potentialWinnings,
  totalOdds,
  riskLevel,
  onSelectLeg
}) => {
  // State for selected legs
  const [selectedLegs, setSelectedLegs] = useState<string[]>(parlayLegs.map(leg => leg.id));
  
  // State for odds animation
  const [animatingOdds, setAnimatingOdds] = useState(false);
  const [displayedOdds, setDisplayedOdds] = useState(totalOdds);
  const [displayedWinnings, setDisplayedWinnings] = useState(potentialWinnings);
  
  // State for expanded view
  const [expanded, setExpanded] = useState(false);
  
  // Calculate color based on risk level
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-600';
      case 'medium':
        return 'bg-yellow-600';
      case 'high':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format odds (American format)
  const formatOdds = (odds: number) => {
    return odds >= 0 ? `+${odds}` : `${odds}`;
  };
  
  // Handle leg selection
  const handleLegSelect = (legId: string) => {
    setSelectedLegs(prev => {
      const isSelected = prev.includes(legId);
      const newSelected = isSelected
        ? prev.filter(id => id !== legId)
        : [...prev, legId];
      
      // Call the callback if provided
      if (onSelectLeg) {
        onSelectLeg(legId, !isSelected);
      }
      
      return newSelected;
    });
  };
  
  // Calculate new odds and winnings based on selected legs
  useEffect(() => {
    if (selectedLegs.length === 0) {
      setAnimatingOdds(true);
      animateValue(displayedOdds, 0, 1000, (value) => setDisplayedOdds(value));
      animateValue(displayedWinnings, 0, 1000, (value) => setDisplayedWinnings(value));
      setTimeout(() => setAnimatingOdds(false), 1000);
      return;
    }
    
    // Calculate new odds based on selected legs
    const selectedParlayLegs = parlayLegs.filter(leg => selectedLegs.includes(leg.id));
    
    // Simple calculation for demo purposes
    // In a real app, this would use proper odds calculation
    let newOdds = selectedParlayLegs.reduce((acc, leg) => acc + leg.odds, 0);
    
    // Calculate potential winnings (simplified)
    // In a real app, this would use proper parlay calculation
    const newWinnings = 100 * (newOdds / 100);
    
    // Animate the changes
    setAnimatingOdds(true);
    animateValue(displayedOdds, newOdds, 1000, (value) => setDisplayedOdds(value));
    animateValue(displayedWinnings, newWinnings, 1000, (value) => setDisplayedWinnings(value));
    setTimeout(() => setAnimatingOdds(false), 1000);
    
  }, [selectedLegs]);
  
  // Animation function for numeric values
  const animateValue = (
    start: number,
    end: number,
    duration: number,
    callback: (value: number) => void
  ) => {
    const startTime = performance.now();
    
    const updateValue = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const value = start + (end - start) * progress;
      
      callback(value);
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };
    
    requestAnimationFrame(updateValue);
  };
  
  // Card variants for animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  // Item variants for staggered animation
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };
  
  // Expanded content variants
  const expandedVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className="bg-betting-card rounded-lg overflow-hidden shadow-lg"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
      transition={{ duration: 0.3 }}
    >
      <div className={`p-4 ${getRiskColor()}`}>
        <h3 className="text-xl font-bold text-white">Recommended Parlay</h3>
      </div>
      
      <div className="p-4">
        {/* Summary section */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-gray-400 text-sm">Potential Winnings</div>
            <motion.div 
              className="text-2xl font-bold text-white"
              key={`winnings-${displayedWinnings.toFixed(0)}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {formatCurrency(displayedWinnings)}
            </motion.div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Total Odds</div>
            <motion.div 
              className="text-2xl font-bold text-white"
              key={`odds-${displayedOdds.toFixed(0)}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {formatOdds(Math.round(displayedOdds))}
            </motion.div>
          </div>
        </div>
        
        {/* Risk level indicator */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Risk Level</span>
            <span className="font-medium text-white">{riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getRiskColor()}`}
              initial={{ width: '0%' }}
              animate={{ 
                width: riskLevel === 'low' ? '33%' : 
                       riskLevel === 'medium' ? '66%' : '100%' 
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        
        {/* Parlay legs */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Parlay Legs ({selectedLegs.length}/{parlayLegs.length})</span>
            <motion.button
              className="text-xs text-gray-400 hover:text-white flex items-center"
              onClick={() => setExpanded(!expanded)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {expanded ? 'Hide Details' : 'Show Details'}
              <motion.svg 
                className="w-4 h-4 ml-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.button>
          </div>
          
          {/* Compact view */}
          {!expanded && (
            <div className="flex flex-wrap gap-2">
              {parlayLegs.map((leg, index) => (
                <motion.div
                  key={leg.id}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                    selectedLegs.includes(leg.id) 
                      ? 'bg-primary text-white' 
                      : 'bg-betting-highlight text-gray-400'
                  }`}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLegSelect(leg.id)}
                >
                  {leg.homeTeam} vs {leg.awayTeam}
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Expanded detailed view */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                className="space-y-2 mt-3"
                variants={expandedVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {parlayLegs.map((leg, index) => (
                  <motion.div
                    key={leg.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedLegs.includes(leg.id) 
                        ? 'bg-primary bg-opacity-20 border border-primary' 
                        : 'bg-betting-highlight bg-opacity-30 border border-transparent'
                    }`}
                    variants={itemVariants}
                    whileHover={{ 
                      backgroundColor: selectedLegs.includes(leg.id) 
                        ? 'rgba(30, 64, 175, 0.3)' 
                        : 'rgba(51, 65, 85, 0.5)' 
                    }}
                    onClick={() => handleLegSelect(leg.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <motion.div 
                          className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center border ${
                            selectedLegs.includes(leg.id) 
                              ? 'border-primary bg-primary' 
                              : 'border-gray-600'
                          }`}
                          animate={{ 
                            scale: selectedLegs.includes(leg.id) ? [1, 1.2, 1] : 1,
                            transition: { duration: 0.3 }
                          }}
                        >
                          {selectedLegs.includes(leg.id) && (
                            <motion.svg 
                              className="w-3 h-3 text-white" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </motion.div>
                        <div>
                          <div className="font-medium text-white">{leg.homeTeam} vs {leg.awayTeam}</div>
                          <div className="text-xs text-gray-400">
                            {leg.betType}: <span className="text-primary-light">{leg.selection}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{formatOdds(leg.odds)}</div>
                        <div className="text-xs text-gray-400">{leg.confidence}% confidence</div>
                      </div>
                    </div>
                    
                    {/* Confidence bar */}
                    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: `${leg.confidence}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-3">
          <motion.button
            className="flex-1 btn btn-outline text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Customize
          </motion.button>
          <motion.button
            className="flex-1 btn btn-primary text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={selectedLegs.length === 0}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Slip
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ParlayRecommendationCard;
