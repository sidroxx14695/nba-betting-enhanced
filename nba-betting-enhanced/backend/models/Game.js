// models/Game.js - MongoDB schema for NBA games with real-time data

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  season: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Final', 'Postponed', 'Canceled'],
    default: 'Scheduled'
  },
  period: {
    type: Number,
    min: 1,
    max: 10, // Up to 6 OT periods
    default: 1
  },
  timeRemaining: {
    type: Number, // Seconds remaining in current period
    min: 0,
    max: 720 // 12 minutes in seconds
  },
  homeTeam: {
    teamId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    abbreviation: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    quarterScores: [Number],
    stats: {
      fieldGoalsMade: { type: Number, default: 0 },
      fieldGoalsAttempted: { type: Number, default: 0 },
      threePointsMade: { type: Number, default: 0 },
      threePointsAttempted: { type: Number, default: 0 },
      freeThrowsMade: { type: Number, default: 0 },
      freeThrowsAttempted: { type: Number, default: 0 },
      rebounds: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      steals: { type: Number, default: 0 },
      blocks: { type: Number, default: 0 },
      turnovers: { type: Number, default: 0 },
      fouls: { type: Number, default: 0 }
    }
  },
  awayTeam: {
    teamId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    abbreviation: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    quarterScores: [Number],
    stats: {
      fieldGoalsMade: { type: Number, default: 0 },
      fieldGoalsAttempted: { type: Number, default: 0 },
      threePointsMade: { type: Number, default: 0 },
      threePointsAttempted: { type: Number, default: 0 },
      freeThrowsMade: { type: Number, default: 0 },
      freeThrowsAttempted: { type: Number, default: 0 },
      rebounds: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      steals: { type: Number, default: 0 },
      blocks: { type: Number, default: 0 },
      turnovers: { type: Number, default: 0 },
      fouls: { type: Number, default: 0 }
    }
  },
  momentum: {
    homeTeamRun: { type: Number, default: 0 },
    awayTeamRun: { type: Number, default: 0 },
    lastScored: { type: String, enum: ['home', 'away', 'none'], default: 'none' },
    recentScoring: [{
      team: { type: String, enum: ['home', 'away'] },
      points: { type: Number },
      timestamp: { type: Date }
    }]
  },
  odds: {
    pregame: {
      homeMoneyline: { type: Number },
      awayMoneyline: { type: Number },
      spread: { type: Number }, // Positive for home team advantage
      total: { type: Number }
    },
    live: {
      homeMoneyline: { type: Number },
      awayMoneyline: { type: Number },
      spread: { type: Number },
      total: { type: Number },
      lastUpdated: { type: Date }
    }
  },
  predictions: {
    currentWinProbability: {
      home: { type: Number, min: 0, max: 1 },
      away: { type: Number, min: 0, max: 1 },
      confidence: { type: Number, min: 0, max: 1 },
      lastUpdated: { type: Date }
    },
    projectedSpread: {
      value: { type: Number },
      confidence: { type: Number, min: 0, max: 1 },
      lastUpdated: { type: Date }
    },
    projectedTotal: {
      value: { type: Number },
      confidence: { type: Number, min: 0, max: 1 },
      lastUpdated: { type: Date }
    },
    history: [{
      timestamp: { type: Date },
      homeWinProbability: { type: Number },
      awayWinProbability: { type: Number },
      projectedSpread: { type: Number },
      projectedTotal: { type: Number }
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate field goal percentage
GameSchema.virtual('homeTeam.stats.fieldGoalPercentage').get(function() {
  if (this.homeTeam.stats.fieldGoalsAttempted === 0) return 0;
  return (this.homeTeam.stats.fieldGoalsMade / this.homeTeam.stats.fieldGoalsAttempted * 100).toFixed(1);
});

GameSchema.virtual('awayTeam.stats.fieldGoalPercentage').get(function() {
  if (this.awayTeam.stats.fieldGoalsAttempted === 0) return 0;
  return (this.awayTeam.stats.fieldGoalsMade / this.awayTeam.stats.fieldGoalsAttempted * 100).toFixed(1);
});

// Calculate three point percentage
GameSchema.virtual('homeTeam.stats.threePointPercentage').get(function() {
  if (this.homeTeam.stats.threePointsAttempted === 0) return 0;
  return (this.homeTeam.stats.threePointsMade / this.homeTeam.stats.threePointsAttempted * 100).toFixed(1);
});

GameSchema.virtual('awayTeam.stats.threePointPercentage').get(function() {
  if (this.awayTeam.stats.threePointsAttempted === 0) return 0;
  return (this.awayTeam.stats.threePointsMade / this.awayTeam.stats.threePointsAttempted * 100).toFixed(1);
});

// Update timestamps on save
GameSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Game', GameSchema);
