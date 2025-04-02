// src/components/betting/RiskProfileCard.tsx - User risk profile visualization

import React from 'react';
import { motion } from 'framer-motion';

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
  // Determine color based on risk category
  const getCategoryColor = () => {
    switch (riskCategory) {
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

  return (
    <motion.div
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`p-4 ${getCategoryColor()}`}>
        <h3 className="text-xl font-bold text-white">Your Risk Profile</h3>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Risk Appetite</span>
            <span className="font-bold">{riskCategory}</span>
          </div>
          
          {/* Risk score visualization */}
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getCategoryColor()}`}
              initial={{ width: '0%' }}
              animate={{ width: `${(riskScore / 10) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          
          <div className="flex justify-between text-xs mt-1 text-gray-500">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-700 p-3 rounded-lg">
            <h4 className="text-sm text-gray-400 mb-1">Single Bet Size</h4>
            <div className="text-lg font-bold">
              {formatCurrency(recommendedBetSizes.singleBet.min)} - {formatCurrency(recommendedBetSizes.singleBet.max)}
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <h4 className="text-sm text-gray-400 mb-1">Parlay Bet Size</h4>
            <div className="text-lg font-bold">
              {formatCurrency(recommendedBetSizes.parlay.min)} - {formatCurrency(recommendedBetSizes.parlay.max)}
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-400">
          <p>Your risk profile determines bet sizes and types of recommendations you'll receive. Update your profile anytime in settings.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default RiskProfileCard;
