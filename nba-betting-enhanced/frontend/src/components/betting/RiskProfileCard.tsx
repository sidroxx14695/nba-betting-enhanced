import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RiskProfileCardProps {
  riskScore: number; // 1-10
  riskCategory: string; // 'Conservative', 'Moderate', or 'Aggressive'
  recommendedBetSizes: {
    singleBet: {
      min: number;
      max: number;
    };
    parlay: {
      min: number;
      max: number;
    };
  };
  currency: string;
}

const RiskProfileCard: React.FC<RiskProfileCardProps> = ({
  riskScore,
  riskCategory,
  recommendedBetSizes,
  currency = 'USD'
}) => {
  // State for interactive risk slider
  const [sliderValue, setSliderValue] = useState(riskScore);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdjustmentMode, setShowAdjustmentMode] = useState(false);
  
  // State for animated transitions
  const [currentCategory, setCurrentCategory] = useState(riskCategory);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // State for recommendation changes
  const [currentRecommendations, setCurrentRecommendations] = useState(recommendedBetSizes);
  const [showRecommendationUpdate, setShowRecommendationUpdate] = useState(false);
  
  // Determine color based on risk category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Conservative':
        return 'bg-blue-600';
      case 'Moderate':
        return 'bg-yellow-600';
      case 'Aggressive':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Determine risk category based on slider value
  const getRiskCategory = (score: number) => {
    if (score <= 3) return 'Conservative';
    if (score <= 7) return 'Moderate';
    return 'Aggressive';
  };
  
  // Calculate recommended bet sizes based on risk score
  const calculateRecommendedBetSizes = (score: number) => {
    // Base values
    const baseSingleMin = 10;
    const baseSingleMax = 50;
    const baseParlayMin = 5;
    const baseParlayMax = 25;
    
    // Multipliers based on risk score (1-10)
    const multiplier = 0.5 + (score / 10) * 2.5; // Ranges from 0.7 to 3.0
    
    return {
      singleBet: {
        min: Math.round(baseSingleMin * multiplier),
        max: Math.round(baseSingleMax * multiplier)
      },
      parlay: {
        min: Math.round(baseParlayMin * multiplier),
        max: Math.round(baseParlayMax * multiplier)
      }
    };
  };
  
  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setSliderValue(newValue);
  };
  
  // Update category and recommendations when slider value changes
  useEffect(() => {
    const newCategory = getRiskCategory(sliderValue);
    
    // If category changed, show transition animation
    if (newCategory !== currentCategory) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCategory(newCategory);
        setIsTransitioning(false);
      }, 300);
    }
    
    // Calculate new recommendations
    const newRecommendations = calculateRecommendedBetSizes(sliderValue);
    
    // Check if recommendations changed significantly
    const singleMinChanged = Math.abs(newRecommendations.singleBet.min - currentRecommendations.singleBet.min) > 5;
    const singleMaxChanged = Math.abs(newRecommendations.singleBet.max - currentRecommendations.singleBet.max) > 5;
    const parlayMinChanged = Math.abs(newRecommendations.parlay.min - currentRecommendations.parlay.min) > 5;
    const parlayMaxChanged = Math.abs(newRecommendations.parlay.max - currentRecommendations.parlay.max) > 5;
    
    if (singleMinChanged || singleMaxChanged || parlayMinChanged || parlayMaxChanged) {
      setCurrentRecommendations(newRecommendations);
      
      // Show recommendation update notification
      if (isDragging === false) {
        setShowRecommendationUpdate(true);
        setTimeout(() => setShowRecommendationUpdate(false), 3000);
      }
    }
  }, [sliderValue, isDragging]);
  
  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  // Item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  // Category transition variants
  const categoryVariants = {
    initial: { opacity: 1 },
    exit: { opacity: 0, y: -20 },
    enter: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Recommendation update notification variants
  const notificationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg relative"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
    >
      <motion.div 
        className={`p-4 ${getCategoryColor(currentCategory)}`}
        animate={{ 
          backgroundColor: isTransitioning ? '#4B5563' : undefined // Gray during transition
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Your Risk Profile</h3>
          
          <motion.button
            className="text-xs text-white bg-black bg-opacity-20 px-2 py-1 rounded-full"
            onClick={() => setShowAdjustmentMode(!showAdjustmentMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showAdjustmentMode ? 'Done' : 'Adjust'}
          </motion.button>
        </div>
      </motion.div>
      
      <div className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Risk Appetite</span>
            
            <AnimatePresence mode="wait">
              <motion.span 
                key={currentCategory}
                className="font-bold"
                variants={categoryVariants}
                initial="enter"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {currentCategory}
              </motion.span>
            </AnimatePresence>
          </div>
          
          {/* Risk score visualization */}
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getCategoryColor(currentCategory)}`}
              initial={{ width: '0%' }}
              animate={{ width: `${(sliderValue / 10) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          
          {/* Interactive slider (shown in adjustment mode) */}
          <AnimatePresence>
            {showAdjustmentMode && (
              <motion.div
                className="mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onTouchStart={() => setIsDragging(true)}
                  onTouchEnd={() => setIsDragging(false)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    // Custom styling for the range input
                    background: `linear-gradient(to right, 
                      #3B82F6 0%, #3B82F6 ${sliderValue <= 3 ? (sliderValue / 10) * 100 : 30}%, 
                      #EAB308 ${sliderValue <= 3 ? (sliderValue / 10) * 100 : 30}%, #EAB308 ${sliderValue <= 7 ? (sliderValue / 10) * 100 : 70}%, 
                      #EF4444 ${sliderValue <= 7 ? (sliderValue / 10) * 100 : 70}%, #EF4444 100%)`,
                    height: '8px',
                    borderRadius: '4px'
                  }}
                />
                
                <div className="flex justify-between text-xs mt-1 text-gray-500">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <motion.div 
                      key={num}
                      className={`w-4 text-center ${sliderValue === num ? 'text-white font-bold' : ''}`}
                      animate={{ 
                        scale: sliderValue === num ? 1.2 : 1,
                        y: sliderValue === num ? -2 : 0
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {num}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex justify-between text-xs mt-1 text-gray-500">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
        </div>
        
        <motion.div 
          className="grid grid-cols-2 gap-4 mt-6"
          variants={itemVariants}
        >
          <motion.div 
            className="bg-gray-700 p-3 rounded-lg"
            whileHover={{ y: -2, backgroundColor: 'rgba(75, 85, 99, 0.8)' }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="text-sm text-gray-400 mb-1">Single Bet Size</h4>
            <motion.div 
              className="text-lg font-bold"
              key={`single-${currentRecommendations.singleBet.min}-${currentRecommendations.singleBet.max}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {formatCurrency(currentRecommendations.singleBet.min)} - {formatCurrency(currentRecommendations.singleBet.max)}
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-700 p-3 rounded-lg"
            whileHover={{ y: -2, backgroundColor: 'rgba(75, 85, 99, 0.8)' }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="text-sm text-gray-400 mb-1">Parlay Bet Size</h4>
            <motion.div 
              className="text-lg font-bold"
              key={`parlay-${currentRecommendations.parlay.min}-${currentRecommendations.parlay.max}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {formatCurrency(currentRecommendations.parlay.min)} - {formatCurrency(currentRecommendations.parlay.max)}
            </motion.div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-6 text-sm text-gray-400"
          variants={itemVariants}
        >
          <p>Your risk profile determines bet sizes and types of recommendations you'll receive. Update your profile anytime in settings.</p>
        </motion.div>
        
        {/* Save button (shown in adjustment mode) */}
        <AnimatePresence>
          {showAdjustmentMode && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                className="w-full btn btn-primary py-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdjustmentMode(false)}
              >
                Save Profile
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Recommendation update notification */}
      <AnimatePresence>
        {showRecommendationUpdate && (
          <motion.div
            className="absolute bottom-4 left-0 right-0 mx-auto w-5/6 bg-primary bg-opacity-90 rounded-lg p-3 shadow-lg"
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="text-white text-sm font-medium">Recommendations Updated</div>
            <div className="text-white text-xs opacity-80">Your bet size recommendations have been adjusted based on your new risk profile.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RiskProfileCard;
