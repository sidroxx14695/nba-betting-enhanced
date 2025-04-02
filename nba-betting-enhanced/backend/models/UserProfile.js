// models/UserProfile.js - MongoDB schema for user risk profiles

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  riskProfile: {
    appetite: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
      required: true
    },
    category: {
      type: String,
      enum: ['Conservative', 'Moderate', 'Aggressive'],
      default: 'Moderate'
    },
    volatilityTolerance: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  budget: {
    amount: {
      type: Number,
      min: 0,
      required: true
    },
    period: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      default: 'Weekly'
    },
    maxBetPercentage: {
      type: Number,
      min: 1,
      max: 100,
      default: 10
    },
    lossLimit: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  preferences: {
    betTypes: [{
      type: String,
      enum: ['moneyline', 'spread', 'total', 'player_prop', 'parlay']
    }],
    minOdds: {
      type: Number,
      default: -200
    },
    maxOdds: {
      type: Number,
      default: 1000
    },
    maxParlayLegs: {
      type: Number,
      min: 2,
      max: 12,
      default: 4
    },
    favoriteTeams: [{
      type: String
    }]
  },
  performance: {
    totalBets: {
      type: Number,
      default: 0
    },
    wonBets: {
      type: Number,
      default: 0
    },
    totalWagered: {
      type: Number,
      default: 0
    },
    totalReturns: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0
    },
    betTypePerformance: {
      moneyline: {
        bets: { type: Number, default: 0 },
        wins: { type: Number, default: 0 }
      },
      spread: {
        bets: { type: Number, default: 0 },
        wins: { type: Number, default: 0 }
      },
      total: {
        bets: { type: Number, default: 0 },
        wins: { type: Number, default: 0 }
      },
      parlay: {
        bets: { type: Number, default: 0 },
        wins: { type: Number, default: 0 }
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate win rate
UserProfileSchema.virtual('performance.winRate').get(function() {
  if (this.performance.totalBets === 0) return 0;
  return (this.performance.wonBets / this.performance.totalBets * 100).toFixed(1);
});

// Calculate ROI
UserProfileSchema.virtual('performance.roi').get(function() {
  if (this.performance.totalWagered === 0) return 0;
  return (((this.performance.totalReturns - this.performance.totalWagered) / 
           this.performance.totalWagered) * 100).toFixed(1);
});

// Calculate recommended bet sizes based on risk profile and budget
UserProfileSchema.methods.getRecommendedBetSizes = function() {
  const { appetite } = this.riskProfile;
  const { amount, period, maxBetPercentage } = this.budget;
  
  // Base percentage on risk appetite (higher risk = higher percentage)
  const basePercentage = (appetite / 10) * maxBetPercentage;
  
  // Adjust for budget period
  let adjustedBudget = amount;
  if (period === 'Monthly') {
    adjustedBudget = amount / 4; // Weekly equivalent
  } else if (period === 'Daily') {
    adjustedBudget = amount * 7; // Weekly equivalent
  }
  
  // Calculate bet sizes
  const maxSingleBet = Math.round((basePercentage / 100) * adjustedBudget);
  
  return {
    singleBet: {
      min: Math.max(1, Math.round(maxSingleBet * 0.5)),
      max: maxSingleBet
    },
    parlay: {
      min: Math.max(1, Math.round(maxSingleBet * 0.3)),
      max: Math.round(maxSingleBet * 0.8)
    }
  };
};

// Update timestamps on save
UserProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
