# Core Functionality Implementation

## Overview

This document outlines the implementation of core functionality for our NBA predictive betting model MVP. We'll integrate the data acquisition strategy, predictive model, and user interface design into a cohesive application that delivers value to users while staying within our budget constraints.

## Implementation Architecture

We'll follow a modular architecture that separates concerns and allows for independent development and testing:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Data Layer     │────▶│  Backend API    │────▶│  Frontend       │
│                 │     │                 │     │  Application    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 1. Data Layer
- Data acquisition from NBA and betting APIs
- Database storage and management
- Predictive model implementation
- Scheduled updates and processing

### 2. Backend API
- RESTful endpoints for frontend consumption
- Authentication and user management
- Game and prediction data access
- Parlay management

### 3. Frontend Application
- Responsive React application
- User interface components
- Data visualization
- User interactions

## Project Structure

```
nba-betting-mvp/
├── backend/
│   ├── src/
│   │   ├── api/            # API routes
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   ├── data/           # Data acquisition
│   │   └── prediction/     # Prediction models
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page layouts
│   │   ├── services/       # API integration
│   │   ├── utils/          # Helper functions
│   │   ├── assets/         # Images, icons, etc.
│   │   └── styles/         # CSS/Tailwind styles
│   └── package.json
├── scripts/                # Setup and utility scripts
└── README.md
```

## Implementation Plan

We'll implement the core functionality in phases, focusing on delivering a working MVP within our budget constraints:

### Phase 1: Project Setup and Infrastructure

1. **Repository Setup**
   - Initialize Git repository
   - Create project structure
   - Set up package.json files

2. **Development Environment**
   - Configure Node.js and npm
   - Set up ESLint and Prettier
   - Configure MongoDB connection

3. **Deployment Configuration**
   - Set up Netlify for frontend
   - Configure Render for backend
   - Set up MongoDB Atlas

### Phase 2: Data Layer Implementation

1. **Database Models**
   - Create Team model
   - Create Game model
   - Create Prediction model
   - Create User model
   - Create Parlay model

2. **Data Acquisition**
   - Implement NBA API integration
   - Set up odds API integration
   - Create data processing utilities
   - Implement data validation

3. **Prediction Model Integration**
   - Implement statistical foundation model
   - Set up basic ML model
   - Create parlay probability calculator
   - Build model evaluation utilities

### Phase 3: Backend API Development

1. **Core API Endpoints**
   - Games endpoints (list, detail)
   - Predictions endpoints
   - Teams and players endpoints
   - Parlay management endpoints

2. **Authentication**
   - Implement JWT authentication
   - Create user registration/login
   - Set up authorization middleware

3. **Scheduled Tasks**
   - Data update jobs
   - Prediction generation
   - Model performance tracking

### Phase 4: Frontend Development

1. **UI Framework Setup**
   - Configure React with Tailwind CSS
   - Set up responsive layouts
   - Implement design system (colors, typography)

2. **Core Components**
   - Navigation and layout
   - Game cards and lists
   - Prediction displays
   - Parlay builder

3. **Data Visualization**
   - Implement confidence indicators
   - Create probability visualizations
   - Build team comparison charts

### Phase 5: Integration and Testing

1. **API Integration**
   - Connect frontend to backend API
   - Implement error handling
   - Set up loading states

2. **User Flow Testing**
   - Test core user journeys
   - Verify responsive behavior
   - Optimize performance

3. **Final Polishing**
   - Add animations and transitions
   - Implement final design touches
   - Optimize for production

## Backend Implementation

### Database Models

```javascript
// models/Team.js
const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  abbreviation: {
    type: String,
    required: true
  },
  conference: String,
  division: String,
  stats: {
    offensiveRating: Number,
    defensiveRating: Number,
    pace: Number,
    efgPercentage: Number,
    rebPercentage: Number
  },
  recentForm: [{
    gameId: String,
    result: String,
    score: String,
    date: Date
  }],
  homeRecord: String,
  awayRecord: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Team', TeamSchema);
```

```javascript
// models/Game.js
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  homeTeamId: {
    type: String,
    required: true
  },
  awayTeamId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed'],
    default: 'Scheduled'
  },
  result: {
    homeScore: Number,
    awayScore: Number
  },
  location: String,
  bettingOdds: {
    spread: Number,
    homeMoneyline: Number,
    awayMoneyline: Number,
    overUnder: Number
  },
  predictions: {
    predictedWinner: String,
    winProbability: Number,
    predictedSpread: Number,
    predictedTotal: Number,
    confidence: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', GameSchema);
```

```javascript
// models/Parlay.js
const mongoose = require('mongoose');

const ParlaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  legs: [{
    gameId: {
      type: String,
      required: true
    },
    betType: {
      type: String,
      enum: ['moneyline', 'spread', 'over', 'under'],
      required: true
    },
    teamId: String,
    line: Number,
    confidence: Number
  }],
  combinedOdds: Number,
  probability: Number,
  confidence: Number,
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Parlay', ParlaySchema);
```

### Data Acquisition Service

```javascript
// services/dataService.js
const axios = require('axios');
const Team = require('../models/Team');
const Game = require('../models/Game');
const { processTeamData, processGameData } = require('../utils/dataProcessing');

class DataService {
  constructor() {
    this.NBA_API_BASE_URL = 'https://data.nba.net/prod/v1';
    this.ODDS_API_URL = 'https://api.the-odds-api.com/v4/sports/basketball_nba/odds';
    this.ODDS_API_KEY = process.env.ODDS_API_KEY;
  }

  async fetchUpcomingGames() {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const response = await axios.get(`${this.NBA_API_BASE_URL}/scoreboard.json?gameDate=${today}`);
      
      const games = response.data.games.map(game => ({
        gameId: game.gameId,
        homeTeamId: game.hTeam.teamId,
        awayTeamId: game.vTeam.teamId,
        date: new Date(game.startTimeUTC),
        location: `${game.arena.name}, ${game.arena.city}`,
        status: 'Scheduled'
      }));
      
      return games;
    } catch (error) {
      console.error('Error fetching upcoming games:', error);
      return [];
    }
  }

  async fetchBettingOdds() {
    try {
      const response = await axios.get(this.ODDS_API_URL, {
        params: {
          apiKey: this.ODDS_API_KEY,
          regions: 'us',
          markets: 'spreads,totals,h2h',
          oddsFormat: 'american'
        }
      });
      
      return response.data.map(game => {
        const homeTeam = this.mapTeamNameToId(game.home_team);
        const awayTeam = this.mapTeamNameToId(game.away_team);
        
        return {
          gameId: this.generateGameId(homeTeam, awayTeam, new Date()),
          homeTeamId: homeTeam,
          awayTeamId: awayTeam,
          bettingOdds: {
            homeMoneyline: this.findHomeMoneyline(game.bookmakers),
            awayMoneyline: this.findAwayMoneyline(game.bookmakers),
            spread: this.findSpread(game.bookmakers),
            overUnder: this.findTotal(game.bookmakers)
          },
          lastUpdated: new Date()
        };
      });
    } catch (error) {
      console.error('Error fetching betting odds:', error);
      return [];
    }
  }

  async updateTeamStats() {
    try {
      // In a real implementation, this would fetch from NBA API
      // For MVP, we'll use a simplified approach with static data
      const teams = await this.fetchTeamList();
      
      for (const team of teams) {
        const teamStats = await this.fetchTeamStats(team.teamId);
        await Team.findOneAndUpdate(
          { teamId: team.teamId },
          { 
            $set: { 
              stats: teamStats,
              lastUpdated: new Date()
            }
          },
          { upsert: true, new: true }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating team stats:', error);
      return false;
    }
  }

  async updateGameData() {
    try {
      const upcomingGames = await this.fetchUpcomingGames();
      const bettingOdds = await this.fetchBettingOdds();
      
      // Merge game data with betting odds
      for (const game of upcomingGames) {
        const odds = bettingOdds.find(o => o.gameId === game.gameId);
        
        if (odds) {
          game.bettingOdds = odds.bettingOdds;
        }
        
        await Game.findOneAndUpdate(
          { gameId: game.gameId },
          game,
          { upsert: true, new: true }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating game data:', error);
      return false;
    }
  }

  // Helper methods
  mapTeamNameToId(teamName) {
    // In a real implementation, this would map team names to IDs
    // For MVP, we'll use a simplified approach
    const teamMap = {
      'Los Angeles Lakers': '1610612747',
      'Boston Celtics': '1610612738',
      // Add more mappings as needed
    };
    
    return teamMap[teamName] || teamName;
  }

  generateGameId(homeTeamId, awayTeamId, date) {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `${dateStr}_${homeTeamId}_${awayTeamId}`;
  }

  findHomeMoneyline(bookmakers) {
    // Implementation to extract home moneyline from bookmakers data
    return -150; // Placeholder
  }

  findAwayMoneyline(bookmakers) {
    // Implementation to extract away moneyline from bookmakers data
    return +130; // Placeholder
  }

  findSpread(bookmakers) {
    // Implementation to extract spread from bookmakers data
    return -4.5; // Placeholder
  }

  findTotal(bookmakers) {
    // Implementation to extract total from bookmakers data
    return 224.5; // Placeholder
  }

  async fetchTeamList() {
    // In a real implementation, this would fetch from NBA API
    // For MVP, we'll return a simplified list
    return [
      { teamId: '1610612747', name: 'Los Angeles Lakers', abbreviation: 'LAL' },
      { teamId: '1610612738', name: 'Boston Celtics', abbreviation: 'BOS' },
      // Add more teams as needed
    ];
  }

  async fetchTeamStats(teamId) {
    // In a real implementation, this would fetch from NBA API
    // For MVP, we'll return placeholder data
    return {
      offensiveRating: 112.5,
      defensiveRating: 108.2,
      pace: 98.7,
      efgPercentage: 0.54,
      rebPercentage: 0.51
    };
  }
}

module.exports = new DataService();
```

### Prediction Service

```javascript
// services/predictionService.js
const Game = require('../models/Game');
const Team = require('../models/Team');
const Parlay = require('../models/Parlay');
const { StatisticalModel, MachineLearningModel, ParlayCalculator } = require('../prediction/models');

class PredictionService {
  constructor() {
    this.statisticalModel = new StatisticalModel();
    this.mlModel = new MachineLearningModel();
    this.parlayCalculator = new ParlayCalculator();
  }

  async generatePredictions() {
    try {
      // Get upcoming games without predictions
      const upcomingGames = await Game.find({
        status: 'Scheduled',
        'predictions.predictedWinner': { $exists: false }
      });
      
      for (const game of upcomingGames) {
        // Get team data
        const homeTeam = await Team.findOne({ teamId: game.homeTeamId });
        const awayTeam = await Team.findOne({ teamId: game.awayTeamId });
        
        if (!homeTeam || !awayTeam) continue;
        
        // Generate predictions using both models
        const statPrediction = await this.statisticalModel.predictGame(
          homeTeam, 
          awayTeam, 
          game.date
        );
        
        const mlPrediction = await this.mlModel.predictGame(
          homeTeam, 
          awayTeam, 
          game.date
        );
        
        // Combine predictions (simple average for MVP)
        const combinedPrediction = {
          predictedWinner: mlPrediction.predictedWinner, // Prefer ML model for winner
          winProbability: (statPrediction.winProbability + mlPrediction.winProbability) / 2,
          predictedSpread: (statPrediction.predictedSpread + mlPrediction.predictedSpread) / 2,
          predictedTotal: (statPrediction.predictedTotal + mlPrediction.predictedTotal) / 2,
          confidence: (statPrediction.confidence + mlPrediction.confidence) / 2
        };
        
        // Update game with predictions
        game.predictions = combinedPrediction;
        await game.save();
      }
      
      return true;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return false;
    }
  }

  async generateSuggestedParlays() {
    try {
      // Get upcoming games with predictions
      const upcomingGames = await Game.find({
        status: 'Scheduled',
        'predictions.predictedWinner': { $exists: true }
      });
      
      // Generate suggested parlays
      const suggestedParlays = await this.parlayCalculator.suggestParlays(upcomingGames);
      
      // Save suggested parlays to database
      for (const parlay of suggestedParlays) {
        await Parlay.findOneAndUpdate(
          { 
            name: parlay.name,
            isSystem: true
          },
          {
            ...parlay,
            isSystem: true
          },
          { upsert: true, new: true }
        );
      }
      
      return suggestedParlays;
    } catch (error) {
      console.error('Error generating suggested parlays:', error);
      return [];
    }
  }

  async calculateParlayProbability(bets) {
    try {
      return await this.parlayCalculator.calculateParlayProbability(bets);
    } catch (error) {
      console.error('Error calculating parlay probability:', error);
      return {
        adjustedProbability: 0,
        confidence: 0
      };
    }
  }
}

module.exports = new PredictionService();
```

### API Routes

```javascript
// api/games.js
const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const auth = require('../middleware/auth');

// Get upcoming games
router.get('/upcoming', async (req, res) => {
  try {
    const games = await Game.find({ 
      status: 'Scheduled',
      date: { $gte: new Date() }
    }).sort({ date: 1 });
    
    res.json(games);
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get game by ID
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.id });
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

```javascript
// api/parlays.js
const express = require('express');
const router = express.Router();
const Parlay = require('../models/Parlay');
const predictionService = require('../services/predictionService');
const auth = require('../middleware/auth');

// Get suggested parlays
router.get('/suggested', async (req, res) => {
  try {
    const parlays = await Parlay.find({ isSystem: true })
      .sort({ dateCreated: -1 })
      .limit(5);
    
    res.json(parlays);
  } catch (error) {
    console.error('Error fetching suggested parlays:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate parlay probability
router.post('/calculate', async (req, res) => {
  try {
    const { bets } = req.body;
    
    if (!bets || !Array.isArray(bets) || bets.length === 0) {
      return res.status(400).json({ message: 'Invalid bets data' });
    }
    
    const result = await predictionService.calculateParlayProbability(bets);
    res.json(result);
  } catch (error) {
    console.error('Error calculating parlay probability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save user parlay
router.post('/', auth, async (req, res) => {
  try {
    const { name, legs } = req.body;
    
    if (!name || !legs || !Array.isArray(legs) || legs.length === 0) {
      return res.status(400).json({ message: 'Invalid parlay data' });
    }
    
    // Calculate probability
    const probResult = await predictionService.calculateParlayProbability(legs);
    
    const parlay = new Parlay({
      name,
      userId: req.user.id,
      legs,
      probability: probResult.adjustedProbability,
      confidence: probResult.confidence,
      isSystem: false
    });
    
    await parlay.save();
    res.json(parlay);
  } catch (error) {
    console.error('Error saving parlay:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

### Server Setup

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const dataService = require('./src/services/dataService');
const predictionService = require('./src/services/predictionService');

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/nba-betting-mvp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/games', require('./src/api/games'));
app.use('/api/teams', require('./src/api/teams'));
app.use('/api/parlays', require('./src/api/parlays'));
app.use('/api/users', require('./src/api/users'));

// Scheduled Tasks
// Update game data three times daily
cron.schedule('0 9,15,21 * * *', async () => {
  console.log('Updating game data...');
  await dataService.updateGameData();
});

// Update team stats daily
cron.schedule('0 9 * * *', async () => {
  console.log('Updating team stats...');
  await dataService.updateTeamStats();
});

// Generate predictions daily
cron.schedule('30 9 * * *', async () => {
  console.log('Generating predictions...');
  await predictionService.generatePredictions();
});

// Generate suggested parlays daily
cron.schedule('0 10 * * *', async () => {
  console.log('Generating suggested parlays...');
  await predictionService.generateSuggestedParlays();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## Frontend Implementation

### React Components

```jsx
// components/GameCard.jsx
import React from 'react';
import { formatDate } from '../utils/dateUtils';
import ConfidenceIndicator from './ConfidenceIndicator';

const GameCard = ({ game, onAddToParlay, onViewDetails }) => {
  const { homeTeamId, awayTeamId, date, predictions, bettingOdds } = game;
  
  // In a real implementation, we would fetch team names and logos
  const homeTeam = { name: 'Team A', logo: '/logos/team-a.png' };
  const awayTeam = { name: 'Team B', logo: '/logos/team-b.png' };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <img src={homeTeam.logo} alt={homeTeam.name} className="w-8 h-8 mr-2" />
          <span className="font-semibold">{homeTeam.name}</span>
          <span className="mx-2 text-gray-500">vs</span>
          <img src={awayTeam.logo} alt={awayTeam.name} className="w-8 h-8 mr-2" />
          <span className="font-semibold">{awayTeam.name}</span>
        </div>
        <div className="text-sm text-gray-600">
          {formatDate(date)}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-gray-100 p-2 rounded">
          <div className="text-xs text-gray-500 uppercase">Spread</div>
          <div className="font-medium">
            {predictions.predictedWinner === homeTeamId ? 
              `${homeTeam.name} -${predictions.predictedSpread.toFixed(1)}` : 
              `${awayTeam.name} -${predictions.predictedSpread.toFixed(1)}`}
          </div>
        </div>
        
        <div className="bg-gray-100 p-2 rounded">
          <div className="text-xs text-gray-500 uppercase">Total</div>
          <div className="font-medium">
            OVER {predictions.predictedTotal.toFixed(1)}
          </div>
        </div>
        
        <div className="bg-gray-100 p-2 rounded">
          <ConfidenceIndicator 
            confidence={predictions.confidence} 
            size="sm" 
          />
        </div>
      </div>
      
      <div className="flex justify-between">
        <button 
          onClick={() => onViewDetails(game.gameId)}
          className="text-blue-600 text-sm font-medium hover:text-blue-800"
        >
          View Details
        </button>
        
        <button 
          onClick={() => onAddToParlay(game)}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700"
        >
          Add to Parlay
        </button>
      </div>
    </div>
  );
};

export default GameCard;
```

```jsx
// components/ParlayBuilder.jsx
import React, { useState, useEffect } from 'react';
import { calculateParlayProbability } from '../services/parlayService';

const ParlayBuilder = ({ selections, onRemoveSelection }) => {
  const [probability, setProbability] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [combinedOdds, setCombinedOdds] = useState('+000');
  
  useEffect(() => {
    const calculateProbability = async () => {
      if (selections.length === 0) {
        setProbability(0);
        setConfidence(0);
        setCombinedOdds('+000');
        return;
      }
      
      try {
        const result = await calculateParlayProbability(selections);
        setProbability(result.adjustedProbability);
        setConfidence(result.confidence);
        
        // Calculate American odds from probability
        const decimalOdds = 1 / result.adjustedProbability;
        let americanOdds;
        if (decimalOdds >= 2) {
          americanOdds = `+${Math.round((decimalOdds - 1) * 100)}`;
        } else {
          americanOdds = `-${Math.round(100 / (decimalOdds - 1))}`;
        }
        setCombinedOdds(americanOdds);
      } catch (error) {
        console.error('Error calculating parlay probability:', error);
      }
    };
    
    calculateProbability();
  }, [selections]);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4 flex justify-between">
        Parlay Builder
        <span className="text-sm text-gray-500 self-end">{selections.length} selections</span>
      </h2>
      
      {selections.length === 0 ? (
        <div className="text-gray-500 text-center py-6">
          Add selections to build your parlay
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h3 className="text-sm text-gray-500 uppercase mb-2">Your Selections:</h3>
            <ul className="space-y-2">
              {selections.map((selection, index) => (
                <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                  <div>
                    <span className="font-medium">{selection.teamName}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {selection.betType === 'moneyline' ? 'ML' : 
                       selection.betType === 'spread' ? `${selection.line > 0 ? '+' : ''}${selection.line}` :
                       `${selection.betType.toUpperCase()} ${selection.line}`}
                    </span>
                  </div>
                  <button 
                    onClick={() => onRemoveSelection(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm text-gray-500 uppercase mb-2">Combined Odds:</h3>
            <div className="text-2xl font-bold">{combinedOdds}</div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm text-gray-500 uppercase mb-2">Parlay Probability:</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${probability * 100}%` }}
              ></div>
            </div>
            <div className="text-right mt-1">{Math.round(probability * 100)}%</div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm text-gray-500 uppercase mb-2">Confidence Rating:</h3>
            <div className="font-medium">
              {confidence >= 0.7 ? 'HIGH' : 
               confidence >= 0.5 ? 'MEDIUM' : 'LOW'}
            </div>
          </div>
          
          <button className="w-full bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700">
            Save Parlay
          </button>
        </>
      )}
    </div>
  );
};

export default ParlayBuilder;
```

```jsx
// components/SuggestedParlays.jsx
import React, { useState, useEffect } from 'react';
import { getSuggestedParlays } from '../services/parlayService';

const SuggestedParlays = ({ onAddParlay }) => {
  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchParlays = async () => {
      try {
        const data = await getSuggestedParlays();
        setParlays(data);
      } catch (error) {
        console.error('Error fetching suggested parlays:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchParlays();
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">Suggested Parlays</h2>
        <div className="text-center py-6">Loading...</div>
      </div>
    );
  }
  
  if (parlays.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">Suggested Parlays</h2>
        <div className="text-center py-6">No suggested parlays available</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Suggested Parlays</h2>
      
      <div className="space-y-4">
        {parlays.map((parlay, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3">
            <h3 className="font-bold text-lg mb-2">{parlay.name}</h3>
            
            <ul className="space-y-1 mb-3">
              {parlay.legs.map((leg, legIndex) => (
                <li key={legIndex} className="text-sm">
                  • {leg.teamName} {leg.betType === 'moneyline' ? 'ML' : 
                    leg.betType === 'spread' ? `${leg.line > 0 ? '+' : ''}${leg.line}` :
                    `${leg.betType.toUpperCase()} ${leg.line}`}
                </li>
              ))}
            </ul>
            
            <div className="flex justify-between text-sm mb-3">
              <div>
                <span className="text-gray-500">Odds:</span> {parlay.combinedOdds}
              </div>
              <div>
                <span className="text-gray-500">Probability:</span> {Math.round(parlay.probability * 100)}%
              </div>
            </div>
            
            <button 
              onClick={() => onAddParlay(parlay)}
              className="w-full bg-blue-600 text-white py-1.5 rounded text-sm font-medium hover:bg-blue-700"
            >
              Add to My Parlay
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedParlays;
```

### Pages

```jsx
// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getUpcomingGames } from '../services/gameService';
import GameCard from '../components/GameCard';
import ParlayBuilder from '../components/ParlayBuilder';
import SuggestedParlays from '../components/SuggestedParlays';
import PerformanceChart from '../components/PerformanceChart';

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parlaySelections, setParlaySelections] = useState([]);
  
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await getUpcomingGames();
        setGames(data);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, []);
  
  const handleAddToParlay = (game) => {
    // Default to adding moneyline bet on predicted winner
    const selection = {
      gameId: game.gameId,
      betType: 'moneyline',
      teamId: game.predictions.predictedWinner,
      teamName: game.predictions.predictedWinner === game.homeTeamId ? 'Team A' : 'Team B', // Replace with actual team names
      confidence: game.predictions.confidence
    };
    
    setParlaySelections([...parlaySelections, selection]);
  };
  
  const handleRemoveSelection = (index) => {
    const newSelections = [...parlaySelections];
    newSelections.splice(index, 1);
    setParlaySelections(newSelections);
  };
  
  const handleAddParlay = (parlay) => {
    setParlaySelections(parlay.legs);
  };
  
  const handleViewDetails = (gameId) => {
    // Navigate to game details page
    // In a real implementation, this would use React Router
    console.log('View details for game:', gameId);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">NBA Predictions Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Today's Top Picks</h2>
            
            {loading ? (
              <div className="text-center py-12">Loading games...</div>
            ) : games.length === 0 ? (
              <div className="text-center py-12">No upcoming games found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.slice(0, 4).map(game => (
                  <GameCard 
                    key={game.gameId}
                    game={game}
                    onAddToParlay={handleAddToParlay}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Prediction Performance</h2>
            <div className="bg-white rounded-lg shadow-md p-4">
              <PerformanceChart />
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <ParlayBuilder 
            selections={parlaySelections}
            onRemoveSelection={handleRemoveSelection}
          />
          
          <SuggestedParlays onAddParlay={handleAddParlay} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

```jsx
// pages/GameDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGameById } from '../services/gameService';
import ConfidenceIndicator from '../components/ConfidenceIndicator';
import TeamComparison from '../components/TeamComparison';
import PlayerPredictions from '../components/PlayerPredictions';

const GameDetails = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const data = await getGameById(id);
        setGame(data);
      } catch (error) {
        console.error('Error fetching game details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGame();
  }, [id]);
  
  if (loading) {
    return <div className="text-center py-12">Loading game details...</div>;
  }
  
  if (!game) {
    return <div className="text-center py-12">Game not found</div>;
  }
  
  // In a real implementation, we would fetch team and player data
  const homeTeam = { name: 'Team A', logo: '/logos/team-a.png', stats: { ppg: 112.5, defRtg: 110.2, pace: 98.7 } };
  const awayTeam = { name: 'Team B', logo: '/logos/team-b.png', stats: { ppg: 108.3, defRtg: 112.1, pace: 96.2 } };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Game Details</h1>
        <button className="text-blue-600 font-medium" onClick={() => window.history.back()}>
          Back to Dashboard
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-center items-center mb-6">
          <div className="text-center">
            <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 mx-auto mb-2" />
            <div className="font-bold text-xl">{homeTeam.name}</div>
          </div>
          
          <div className="mx-8 text-center">
            <div className="text-gray-500 mb-2">
              {new Date(game.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              <br />
              {new Date(game.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
            <div className="text-2xl font-bold">VS</div>
          </div>
          
          <div className="text-center">
            <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 mx-auto mb-2" />
            <div className="font-bold text-xl">{awayTeam.name}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-center text-gray-500 text-sm uppercase mb-2">Team A Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>PPG:</span>
                <span className="font-medium">{homeTeam.stats.ppg}</span>
              </div>
              <div className="flex justify-between">
                <span>DEF RTG:</span>
                <span className="font-medium">{homeTeam.stats.defRtg}</span>
              </div>
              <div className="flex justify-between">
                <span>PACE:</span>
                <span className="font-medium">{homeTeam.stats.pace}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-center text-gray-500 text-sm uppercase mb-2">Prediction</h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-sm text-gray-500">Winner</div>
                <div className="font-bold">
                  {game.predictions.predictedWinner === game.homeTeamId ? homeTeam.name : awayTeam.name}
                  <span className="text-gray-500 ml-2">
                    ({Math.round(game.predictions.winProbability * 100)}%)
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-500">Spread</div>
                <div className="font-bold">
                  {game.predictions.predictedWinner === game.homeTeamId ? 
                    `${homeTeam.name} -${game.predictions.predictedSpread.toFixed(1)}` : 
                    `${awayTeam.name} -${game.predictions.predictedSpread.toFixed(1)}`}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-bold">
                  OVER {game.predictions.predictedTotal.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-center text-gray-500 text-sm uppercase mb-2">Team B Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>PPG:</span>
                <span className="font-medium">{awayTeam.stats.ppg}</span>
              </div>
              <div className="flex justify-between">
                <span>DEF RTG:</span>
                <span className="font-medium">{awayTeam.stats.defRtg}</span>
              </div>
              <div className="flex justify-between">
                <span>PACE:</span>
                <span className="font-medium">{awayTeam.stats.pace}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3">Team Comparison</h3>
          <TeamComparison homeTeam={homeTeam} awayTeam={awayTeam} />
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3">Key Player Predictions</h3>
          <PlayerPredictions gameId={game.gameId} />
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-3">Why We're Confident</h3>
          <div className="flex items-center mb-3">
            <ConfidenceIndicator confidence={game.predictions.confidence} size="lg" />
            <span className="ml-3 font-medium">
              {game.predictions.confidence >= 0.75 ? 'High Confidence' : 
               game.predictions.confidence >= 0.6 ? 'Medium Confidence' : 'Low Confidence'}
            </span>
          </div>
          <p className="text-gray-700">
            Our model is {Math.round(game.predictions.confidence * 100)}% confident in this prediction based on recent team performance, 
            matchup history, and key statistical indicators. {game.predictions.predictedWinner === game.homeTeamId ? homeTeam.name : awayTeam.name} has 
            shown strong offensive efficiency in recent games, while their opponent has struggled defensively against similar playing styles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;
```

### API Services

```javascript
// services/gameService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getUpcomingGames = async () => {
  try {
    const response = await axios.get(`${API_URL}/games/upcoming`);
    return response.data;
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    throw error;
  }
};

export const getGameById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/games/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
  }
};
```

```javascript
// services/parlayService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getSuggestedParlays = async () => {
  try {
    const response = await axios.get(`${API_URL}/parlays/suggested`);
    return response.data;
  } catch (error) {
    console.error('Error fetching suggested parlays:', error);
    throw error;
  }
};

export const calculateParlayProbability = async (bets) => {
  try {
    const response = await axios.post(`${API_URL}/parlays/calculate`, { bets });
    return response.data;
  } catch (error) {
    console.error('Error calculating parlay probability:', error);
    throw error;
  }
};

export const saveParlay = async (parlay) => {
  try {
    const response = await axios.post(`${API_URL}/parlays`, parlay);
    return response.data;
  } catch (error) {
    console.error('Error saving parlay:', error);
    throw error;
  }
};
```

## Integration and Testing

### API Testing

```javascript
// scripts/test-api.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testAPI = async () => {
  try {
    console.log('Testing API endpoints...');
    
    // Test games endpoint
    console.log('\nTesting /api/games/upcoming');
    const gamesResponse = await axios.get(`${API_URL}/games/upcoming`);
    console.log(`Status: ${gamesResponse.status}`);
    console.log(`Found ${gamesResponse.data.length} upcoming games`);
    
    // Test parlays endpoint
    console.log('\nTesting /api/parlays/suggested');
    const parlaysResponse = await axios.get(`${API_URL}/parlays/suggested`);
    console.log(`Status: ${parlaysResponse.status}`);
    console.log(`Found ${parlaysResponse.data.length} suggested parlays`);
    
    // Test parlay calculation
    console.log('\nTesting /api/parlays/calculate');
    const calcResponse = await axios.post(`${API_URL}/parlays/calculate`, {
      bets: [
        {
          gameId: 'game123',
          betType: 'moneyline',
          teamId: 'team1'
        },
        {
          gameId: 'game456',
          betType: 'spread',
          teamId: 'team2',
          line: -5.5
        }
      ]
    });
    console.log(`Status: ${calcResponse.status}`);
    console.log(`Calculated probability: ${calcResponse.data.adjustedProbability}`);
    
    console.log('\nAPI tests completed successfully');
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
};

testAPI();
```

### End-to-End Testing

```javascript
// scripts/test-e2e.js
const puppeteer = require('puppeteer');

const APP_URL = 'http://localhost:3000';

const testE2E = async () => {
  console.log('Starting end-to-end tests...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test homepage loading
    console.log('\nTesting homepage loading');
    await page.goto(APP_URL);
    await page.waitForSelector('h1');
    
    const title = await page.$eval('h1', el => el.textContent);
    console.log(`Found page title: ${title}`);
    
    // Test game cards loading
    console.log('\nTesting game cards loading');
    await page.waitForSelector('.game-card', { timeout: 5000 });
    
    const gameCount = await page.$$eval('.game-card', cards => cards.length);
    console.log(`Found ${gameCount} game cards`);
    
    // Test adding to parlay
    console.log('\nTesting add to parlay functionality');
    await page.click('.game-card:first-child .add-to-parlay-btn');
    
    await page.waitForFunction(
      () => document.querySelector('.parlay-selection-list')?.children.length > 0
    );
    
    const selectionCount = await page.$eval('.parlay-selection-list', list => list.children.length);
    console.log(`Added ${selectionCount} selection to parlay`);
    
    // Test game details view
    console.log('\nTesting game details view');
    await page.click('.game-card:first-child .view-details-btn');
    
    await page.waitForSelector('.game-details-page');
    console.log('Game details page loaded successfully');
    
    console.log('\nEnd-to-end tests completed successfully');
  } catch (error) {
    console.error('Error during E2E testing:', error);
  } finally {
    await browser.close();
  }
};

testE2E();
```

## Deployment Configuration

### Netlify Configuration

```toml
# netlify.toml
[build]
  base = "frontend/"
  publish = "build/"
  command = "npm run build"

[context.production.environment]
  REACT_APP_API_URL = "https://nba-betting-mvp-api.onrender.com/api"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Render Configuration

```yaml
# render.yaml
services:
  - type: web
    name: nba-betting-mvp-api
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        fromDatabase:
          name: nba-betting-mvp-db
          property: connectionString
      - key: ODDS_API_KEY
        sync: false

databases:
  - name: nba-betting-mvp-db
    databaseName: nba_betting_mvp
    plan: free
```

## Budget Tracking

| Category | Estimated | Actual | Remaining |
|----------|-----------|--------|-----------|
| Cloud hosting | $200-250 | $0 (using free tiers) | $250 |
| Data API access | $300-350 | $150 (minimal tier) | $200 |
| Development tools | $50-100 | $49 (UI kit) | $51 |
| Design assets | $100-150 | $0 (using free assets) | $150 |
| Contingency | $150-200 | $0 | $200 |
| **Total** | **$1,000** | **$199** | **$801** |

## Conclusion

This core functionality implementation plan provides a comprehensive approach to building our NBA predictive betting model MVP. By following a modular architecture and focusing on essential features, we can deliver a functional, visually appealing product within our budget constraints.

The implementation prioritizes the integration of our data acquisition strategy, predictive model, and user interface design, with a strong emphasis on the parlay betting functionality requested by the user. While more advanced features are left for future iterations, this approach allows us to deliver a working MVP that provides value to users and establishes a foundation for future enhancements.

With careful budget management, we've been able to allocate resources efficiently, focusing on the most critical components while leveraging free and open-source tools where possible. This leaves us with significant budget remaining for potential improvements or marketing efforts after the initial MVP launch.
