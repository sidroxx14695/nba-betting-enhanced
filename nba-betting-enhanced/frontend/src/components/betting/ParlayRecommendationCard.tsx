// src/components/betting/ParlayRecommendationCard.tsx - Personalized parlay recommendation card

import React from 'react';
import { motion } from 'framer-motion';

interface ParlayLeg {
  type: string;
  gameId: string;
  team: string;
  teamName: string;
  odds: number;
  winProbability: number;
  confidence: number;
}

interface ParlayRecommendationCardProps {
  legs: ParlayLeg[];
  combinedOdds: number;
  winProbability: number;
  confidence: number;
  recommendedStake: number;
  currency?: string;
  onSelect?: () => void;
}

const ParlayRecommendationCard: React.FC<ParlayRecommendationCardProps> = ({
  legs,
  combinedOdds,
  winProbability,
  confidence,
  recommendedStake,
  currency = 'USD',
  onSelect
}) => {
  // Format odds in American format
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
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

  // Calculate potential payout
  const calculatePayout = () => {
    if (combinedOdds > 0) {
      return recommendedStake * (combinedOdds / 100) + recommendedStake;
    } else {
      return recommendedStake * (100 / Math.abs(combinedOdds)) + recommendedStake;
    }
  };

  return (
    <motion.div
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-indigo-500 transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-indigo-900 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">{legs.length}-Leg Parlay</h3>
          <span className="text-indigo-300 font-bold">{formatOdds(combinedOdds)}</span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Parlay legs */}
        <div className="space-y-3 mb-4">
          {legs.map((leg, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <div>
                <div className="font-medium">{leg.teamName}</div>
                <div className="text-xs text-gray-400">
                  {leg.type === 'moneyline' ? 'Moneyline' : leg.type}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatOdds(leg.odds)}</div>
                <div className="text-xs text-gray-400">
                  {(leg.winProbability * 100).toFixed(1)}% win prob
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Parlay stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-700 p-2 rounded text-center">
            <div className="text-xs text-gray-400">Win Prob</div>
            <div className="font-bold">{(winProbability * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-gray-700 p-2 rounded text-center">
            <div className="text-xs text-gray-400">Confidence</div>
            <div className="font-bold">{(confidence * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-gray-700 p-2 rounded text-center">
            <div className="text-xs text-gray-400">Rec. Stake</div>
            <div className="font-bold">{formatCurrency(recommendedStake)}</div>
          </div>
        </div>
        
        {/* Potential payout */}
        <div className="bg-indigo-900 bg-opacity-30 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Potential Payout:</span>
            <span className="text-xl font-bold text-indigo-300">
              {formatCurrency(calculatePayout())}
            </span>
          </div>
        </div>
        
        {/* Action button */}
        <button
          onClick={onSelect}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors duration-300"
        >
          Add to Bet Slip
        </button>
      </div>
    </motion.div>
  );
};

export default ParlayRecommendationCard;
