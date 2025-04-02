# Deployment and Testing Plan

## Overview

This document outlines the deployment and testing strategy for our NBA predictive betting model MVP. We'll implement a systematic approach to deploy the application, conduct thorough testing, and ensure all components work together seamlessly while staying within our budget constraints.

## Deployment Strategy

We'll use a phased deployment approach to minimize risks and ensure each component functions correctly:

### Phase 1: Development Environment Setup

1. **Local Development Environment**
   - Set up local MongoDB instance
   - Configure Node.js backend with environment variables
   - Set up React frontend with development proxies

2. **Version Control**
   - Initialize Git repository
   - Create development and main branches
   - Set up .gitignore for sensitive files

3. **Continuous Integration**
   - Configure GitHub Actions for automated testing
   - Set up linting and code quality checks
   - Implement test automation

### Phase 2: Backend Deployment

1. **Database Deployment**
   - Set up MongoDB Atlas free tier cluster
   - Configure network access and security
   - Create database user with restricted permissions
   - Set up initial collections

2. **API Deployment**
   - Deploy Node.js backend to Render (free tier)
   - Configure environment variables
   - Set up CORS for frontend access
   - Implement basic health checks

3. **Data Pipeline Setup**
   - Configure scheduled tasks for data acquisition
   - Set up error logging and monitoring
   - Implement fallback mechanisms for API failures

### Phase 3: Frontend Deployment

1. **Static Assets**
   - Optimize images and assets
   - Configure CDN for static content (Netlify CDN)
   - Implement caching strategies

2. **Frontend Deployment**
   - Build production React application
   - Deploy to Netlify (free tier)
   - Configure environment variables
   - Set up redirects for client-side routing

3. **Domain and SSL**
   - Use free Netlify subdomain for MVP
   - Configure SSL certificates (automatic with Netlify)
   - Set up proper security headers

### Phase 4: Integration and Monitoring

1. **End-to-End Testing**
   - Verify API connectivity from production frontend
   - Test user flows in production environment
   - Validate data processing pipeline

2. **Monitoring Setup**
   - Implement basic application logging
   - Set up uptime monitoring (free tier of UptimeRobot)
   - Configure error alerting

3. **Performance Optimization**
   - Analyze initial load performance
   - Implement critical path optimizations
   - Configure proper caching headers

## Testing Strategy

We'll implement a comprehensive testing approach to ensure the quality and reliability of our MVP:

### 1. Unit Testing

**Backend Unit Tests:**
```javascript
// Example unit test for prediction service
const { expect } = require('chai');
const sinon = require('sinon');
const { StatisticalModel } = require('../src/prediction/models');
const predictionService = require('../src/services/predictionService');

describe('Prediction Service', () => {
  describe('generatePredictions', () => {
    it('should generate predictions for upcoming games', async () => {
      // Mock dependencies
      const mockGame = {
        gameId: 'game123',
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        date: new Date(),
        save: sinon.stub().resolves()
      };
      
      const mockTeam = {
        teamId: 'team1',
        name: 'Team A',
        stats: {
          offensiveRating: 110,
          defensiveRating: 105
        }
      };
      
      // Setup stubs
      sinon.stub(Game, 'find').resolves([mockGame]);
      sinon.stub(Team, 'findOne').resolves(mockTeam);
      sinon.stub(StatisticalModel.prototype, 'predictGame').resolves({
        predictedWinner: 'team1',
        winProbability: 0.65,
        predictedSpread: 5.5,
        predictedTotal: 220,
        confidence: 0.7
      });
      
      // Execute
      const result = await predictionService.generatePredictions();
      
      // Assert
      expect(result).to.be.true;
      expect(mockGame.save.calledOnce).to.be.true;
      expect(mockGame.predictions).to.exist;
      expect(mockGame.predictions.predictedWinner).to.equal('team1');
      
      // Restore stubs
      Game.find.restore();
      Team.findOne.restore();
      StatisticalModel.prototype.predictGame.restore();
    });
  });
});
```

**Frontend Unit Tests:**
```javascript
// Example unit test for GameCard component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameCard from '../components/GameCard';

describe('GameCard Component', () => {
  const mockGame = {
    gameId: 'game123',
    homeTeamId: 'team1',
    awayTeamId: 'team2',
    date: new Date().toISOString(),
    predictions: {
      predictedWinner: 'team1',
      winProbability: 0.65,
      predictedSpread: 5.5,
      predictedTotal: 220,
      confidence: 0.7
    },
    bettingOdds: {
      spread: -5.5,
      homeMoneyline: -180,
      awayMoneyline: +160,
      overUnder: 220.5
    }
  };
  
  const mockHandleAddToParlay = jest.fn();
  const mockHandleViewDetails = jest.fn();
  
  it('renders game information correctly', () => {
    render(
      <GameCard 
        game={mockGame}
        onAddToParlay={mockHandleAddToParlay}
        onViewDetails={mockHandleViewDetails}
      />
    );
    
    expect(screen.getByText(/Team A/i)).toBeInTheDocument();
    expect(screen.getByText(/Team B/i)).toBeInTheDocument();
    expect(screen.getByText(/OVER 220/i)).toBeInTheDocument();
  });
  
  it('calls onAddToParlay when add button is clicked', () => {
    render(
      <GameCard 
        game={mockGame}
        onAddToParlay={mockHandleAddToParlay}
        onViewDetails={mockHandleViewDetails}
      />
    );
    
    fireEvent.click(screen.getByText(/Add to Parlay/i));
    expect(mockHandleAddToParlay).toHaveBeenCalledWith(mockGame);
  });
  
  it('calls onViewDetails when view details button is clicked', () => {
    render(
      <GameCard 
        game={mockGame}
        onAddToParlay={mockHandleAddToParlay}
        onViewDetails={mockHandleViewDetails}
      />
    );
    
    fireEvent.click(screen.getByText(/View Details/i));
    expect(mockHandleViewDetails).toHaveBeenCalledWith('game123');
  });
});
```

### 2. Integration Testing

**API Integration Tests:**
```javascript
// Example API integration test
const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('API Integration Tests', () => {
  let mongoServer;
  
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });
  
  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  describe('GET /api/games/upcoming', () => {
    it('should return upcoming games', async () => {
      // Seed test data
      await Game.create({
        gameId: 'game123',
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        date: new Date(Date.now() + 86400000), // Tomorrow
        status: 'Scheduled',
        predictions: {
          predictedWinner: 'team1',
          winProbability: 0.65,
          predictedSpread: 5.5,
          predictedTotal: 220,
          confidence: 0.7
        }
      });
      
      const response = await request(app)
        .get('/api/games/upcoming')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.equal(1);
      expect(response.body[0].gameId).to.equal('game123');
    });
  });
  
  describe('POST /api/parlays/calculate', () => {
    it('should calculate parlay probability', async () => {
      const response = await request(app)
        .post('/api/parlays/calculate')
        .send({
          bets: [
            {
              gameId: 'game123',
              betType: 'moneyline',
              teamId: 'team1'
            }
          ]
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.have.property('adjustedProbability');
      expect(response.body.adjustedProbability).to.be.a('number');
    });
    
    it('should return 400 for invalid request', async () => {
      await request(app)
        .post('/api/parlays/calculate')
        .send({})
        .expect(400);
    });
  });
});
```

**Frontend Integration Tests:**
```javascript
// Example frontend integration test
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import Dashboard from '../pages/Dashboard';

// Mock API responses
const server = setupServer(
  rest.get('http://localhost:5000/api/games/upcoming', (req, res, ctx) => {
    return res(ctx.json([
      {
        gameId: 'game123',
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        date: new Date().toISOString(),
        predictions: {
          predictedWinner: 'team1',
          winProbability: 0.65,
          predictedSpread: 5.5,
          predictedTotal: 220,
          confidence: 0.7
        }
      }
    ]));
  }),
  
  rest.get('http://localhost:5000/api/parlays/suggested', (req, res, ctx) => {
    return res(ctx.json([
      {
        name: 'High Confidence Parlay #1',
        legs: [
          {
            gameId: 'game123',
            betType: 'moneyline',
            teamId: 'team1',
            teamName: 'Team A',
            confidence: 0.7
          }
        ],
        probability: 0.65,
        confidence: 0.7
      }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Dashboard Integration', () => {
  it('loads and displays games', async () => {
    render(<Dashboard />);
    
    // Check loading state
    expect(screen.getByText(/Loading games/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
    });
    
    // Check game card content
    expect(screen.getByText(/OVER 220/i)).toBeInTheDocument();
  });
  
  it('adds game to parlay when clicked', async () => {
    render(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
    });
    
    // Click add to parlay
    fireEvent.click(screen.getByText(/Add to Parlay/i));
    
    // Check if added to parlay builder
    await waitFor(() => {
      expect(screen.getByText(/Team A ML/i)).toBeInTheDocument();
    });
  });
});
```

### 3. End-to-End Testing

**Automated E2E Tests:**
```javascript
// Example E2E test using Cypress
describe('NBA Betting MVP', () => {
  beforeEach(() => {
    // Visit the app
    cy.visit('/');
  });
  
  it('displays the dashboard with game cards', () => {
    // Check page title
    cy.contains('h1', 'NBA Predictions Dashboard').should('be.visible');
    
    // Check for game cards
    cy.get('.game-card').should('have.length.at.least', 1);
  });
  
  it('allows adding games to parlay', () => {
    // Find first game card and add to parlay
    cy.get('.game-card').first().within(() => {
      cy.contains('Add to Parlay').click();
    });
    
    // Check if game was added to parlay builder
    cy.get('.parlay-builder').within(() => {
      cy.get('.parlay-selection').should('have.length', 1);
    });
  });
  
  it('navigates to game details page', () => {
    // Find first game card and view details
    cy.get('.game-card').first().within(() => {
      cy.contains('View Details').click();
    });
    
    // Check if navigated to details page
    cy.url().should('include', '/games/');
    cy.contains('Game Details').should('be.visible');
    
    // Check for team comparison
    cy.contains('Team Comparison').should('be.visible');
  });
  
  it('shows suggested parlays', () => {
    // Check for suggested parlays section
    cy.contains('h2', 'Suggested Parlays').should('be.visible');
    
    // Check for at least one suggested parlay
    cy.get('.suggested-parlay').should('have.length.at.least', 1);
  });
});
```

**Manual Testing Checklist:**

1. **User Interface Testing**
   - [ ] Verify responsive design on mobile, tablet, and desktop
   - [ ] Check color scheme and visual elements for consistency
   - [ ] Validate typography and readability
   - [ ] Test navigation and user flows
   - [ ] Verify loading states and error messages

2. **Functionality Testing**
   - [ ] Test game card display and information
   - [ ] Verify prediction confidence indicators
   - [ ] Test parlay builder functionality
   - [ ] Validate suggested parlays display
   - [ ] Check game details page and team comparisons

3. **Performance Testing**
   - [ ] Measure initial page load time
   - [ ] Test responsiveness under load
   - [ ] Verify API response times
   - [ ] Check memory usage and potential leaks

4. **Cross-Browser Testing**
   - [ ] Test on Chrome, Firefox, Safari, and Edge
   - [ ] Verify mobile browser compatibility
   - [ ] Check for rendering inconsistencies

### 4. Data Validation Testing

**Data Pipeline Tests:**
```javascript
// Example data validation test
const { expect } = require('chai');
const dataService = require('../src/services/dataService');
const Game = require('../src/models/Game');
const Team = require('../src/models/Team');

describe('Data Pipeline Validation', () => {
  before(async () => {
    // Connect to test database
    // Clear existing data
  });
  
  it('should fetch and process NBA game data correctly', async () => {
    // Execute data update
    await dataService.updateGameData();
    
    // Verify data was stored correctly
    const games = await Game.find();
    expect(games).to.have.length.greaterThan(0);
    
    // Check data structure
    const game = games[0];
    expect(game).to.have.property('gameId');
    expect(game).to.have.property('homeTeamId');
    expect(game).to.have.property('awayTeamId');
    expect(game).to.have.property('date');
    
    // Verify betting odds if available
    if (game.bettingOdds) {
      expect(game.bettingOdds).to.have.property('spread');
      expect(game.bettingOdds.spread).to.be.a('number');
    }
  });
  
  it('should update team statistics correctly', async () => {
    // Execute team stats update
    await dataService.updateTeamStats();
    
    // Verify team data
    const teams = await Team.find();
    expect(teams).to.have.length.greaterThan(0);
    
    // Check team stats structure
    const team = teams[0];
    expect(team).to.have.property('stats');
    expect(team.stats).to.have.property('offensiveRating');
    expect(team.stats).to.have.property('defensiveRating');
    expect(team.stats.offensiveRating).to.be.a('number');
  });
});
```

**Prediction Model Validation:**
```javascript
// Example prediction model validation
const { expect } = require('chai');
const { StatisticalModel, MachineLearningModel } = require('../src/prediction/models');

describe('Prediction Model Validation', () => {
  let statModel, mlModel;
  let testGames;
  
  before(async () => {
    // Initialize models
    statModel = new StatisticalModel();
    mlModel = new MachineLearningModel();
    
    // Load test data
    testGames = [/* historical game data */];
  });
  
  it('should predict game winners with reasonable accuracy', async () => {
    let correctPredictions = 0;
    
    for (const game of testGames) {
      const prediction = await statModel.predictGame(
        { teamId: game.homeTeamId, stats: game.homeTeamStats },
        { teamId: game.awayTeamId, stats: game.awayTeamStats },
        game.date
      );
      
      const actualWinner = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
      
      if (prediction.predictedWinner === actualWinner) {
        correctPredictions++;
      }
    }
    
    const accuracy = correctPredictions / testGames.length;
    console.log(`Statistical model accuracy: ${accuracy.toFixed(2)}`);
    
    // Expect better than random chance (>0.5)
    expect(accuracy).to.be.greaterThan(0.5);
  });
  
  it('should predict spreads with reasonable error margin', async () => {
    let totalError = 0;
    
    for (const game of testGames) {
      const prediction = await statModel.predictGame(
        { teamId: game.homeTeamId, stats: game.homeTeamStats },
        { teamId: game.awayTeamId, stats: game.awayTeamStats },
        game.date
      );
      
      const actualSpread = game.homeScore - game.awayScore;
      const predictedSpread = prediction.predictedWinner === game.homeTeamId ? 
        prediction.predictedSpread : -prediction.predictedSpread;
      
      totalError += Math.abs(predictedSpread - actualSpread);
    }
    
    const meanAbsoluteError = totalError / testGames.length;
    console.log(`Spread prediction MAE: ${meanAbsoluteError.toFixed(2)}`);
    
    // Expect reasonable error margin (<10 points)
    expect(meanAbsoluteError).to.be.lessThan(10);
  });
});
```

## Deployment Process

### 1. Backend Deployment to Render

1. **Prepare Backend for Deployment**

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create production build
npm run build

# Test production build locally
NODE_ENV=production npm start
```

2. **Deploy to Render**

- Create a new Web Service on Render
- Connect to GitHub repository
- Configure build settings:
  - Build Command: `cd backend && npm install`
  - Start Command: `cd backend && npm start`
- Add environment variables:
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: [MongoDB Atlas connection string]
  - `ODDS_API_KEY`: [API key]
  - `JWT_SECRET`: [generated secret]
- Deploy the service

3. **Verify Backend Deployment**

```bash
# Test API endpoint
curl https://nba-betting-mvp-api.onrender.com/api/games/upcoming

# Check health endpoint
curl https://nba-betting-mvp-api.onrender.com/api/health
```

### 2. Frontend Deployment to Netlify

1. **Prepare Frontend for Deployment**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create production build
REACT_APP_API_URL=https://nba-betting-mvp-api.onrender.com/api npm run build

# Test production build locally
npx serve -s build
```

2. **Deploy to Netlify**

- Create a new site on Netlify
- Connect to GitHub repository
- Configure build settings:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `build`
- Add environment variables:
  - `REACT_APP_API_URL`: `https://nba-betting-mvp-api.onrender.com/api`
- Deploy the site

3. **Verify Frontend Deployment**

- Open the Netlify URL in browser
- Verify that the application loads correctly
- Test core functionality
- Check console for any errors

### 3. Database Setup on MongoDB Atlas

1. **Create MongoDB Atlas Cluster**

- Sign up for MongoDB Atlas free tier
- Create a new cluster
- Configure IP whitelist to allow access from Render
- Create a database user with read/write permissions

2. **Set Up Database Collections**

```javascript
// Example script to initialize database
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function initializeDatabase() {
  try {
    await client.connect();
    const database = client.db('nba-betting-mvp');
    
    // Create collections with validation
    await database.createCollection('teams', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['teamId', 'name'],
          properties: {
            teamId: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            name: {
              bsonType: 'string',
              description: 'must be a string and is required'
            }
          }
        }
      }
    });
    
    await database.createCollection('games', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['gameId', 'homeTeamId', 'awayTeamId', 'date'],
          properties: {
            gameId: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            homeTeamId: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            awayTeamId: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            date: {
              bsonType: 'date',
              description: 'must be a date and is required'
            }
          }
        }
      }
    });
    
    // Create indexes
    await database.collection('teams').createIndex({ teamId: 1 }, { unique: true });
    await database.collection('games').createIndex({ gameId: 1 }, { unique: true });
    await database.collection('games').createIndex({ date: 1 });
    
    console.log('Database initialized successfully');
  } finally {
    await client.close();
  }
}

initializeDatabase().catch(console.error);
```

3. **Seed Initial Data**

```javascript
// Example script to seed initial data
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function seedDatabase() {
  try {
    await client.connect();
    const database = client.db('nba-betting-mvp');
    
    // Seed teams collection
    const teams = [
      {
        teamId: '1610612747',
        name: 'Los Angeles Lakers',
        abbreviation: 'LAL',
        conference: 'West',
        division: 'Pacific',
        stats: {
          offensiveRating: 112.5,
          defensiveRating: 108.2,
          pace: 98.7,
          efgPercentage: 0.54,
          rebPercentage: 0.51
        }
      },
      {
        teamId: '1610612738',
        name: 'Boston Celtics',
        abbreviation: 'BOS',
        conference: 'East',
        division: 'Atlantic',
        stats: {
          offensiveRating: 116.3,
          defensiveRating: 106.5,
          pace: 97.2,
          efgPercentage: 0.56,
          rebPercentage: 0.52
        }
      }
      // Add more teams as needed
    ];
    
    await database.collection('teams').insertMany(teams);
    
    // Seed sample games
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const games = [
      {
        gameId: `${tomorrow.toISOString().split('T')[0].replace(/-/g, '')}_1610612747_1610612738`,
        homeTeamId: '1610612747',
        awayTeamId: '1610612738',
        date: tomorrow,
        status: 'Scheduled',
        location: 'Staples Center, Los Angeles',
        bettingOdds: {
          spread: -3.5,
          homeMoneyline: -160,
          awayMoneyline: +140,
          overUnder: 222.5
        }
      }
      // Add more games as needed
    ];
    
    await database.collection('games').insertMany(games);
    
    console.log('Database seeded successfully');
  } finally {
    await client.close();
  }
}

seedDatabase().catch(console.error);
```

## Monitoring and Maintenance

### 1. Application Monitoring

1. **Set Up Basic Logging**

```javascript
// Example logging middleware for Express
const winston = require('winston');
const expressWinston = require('express-winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Add to Express app
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false
}));

// Error logging middleware
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));
```

2. **Set Up Uptime Monitoring**

- Create account on UptimeRobot (free tier)
- Add monitors for:
  - Backend API health endpoint
  - Frontend application
  - Set check interval to 5 minutes
  - Configure email alerts for downtime

3. **Performance Monitoring**

```javascript
// Example performance middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
    
    logger.info({
      type: 'request_performance',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration
    });
  });
  
  next();
});
```

### 2. Error Handling and Recovery

1. **API Error Handling**

```javascript
// Global error handler for Express
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body
  });
  
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 
        'An unexpected error occurred' : err.message
    }
  });
});
```

2. **Frontend Error Boundary**

```jsx
// Error boundary component
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error loading this page.</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

3. **Data Recovery Procedures**

```javascript
// Example data recovery script
const dataService = require('../src/services/dataService');
const Game = require('../src/models/Game');
const Team = require('../src/models/Team');

async function recoverData() {
  try {
    console.log('Starting data recovery process...');
    
    // Check for missing team data
    const teams = await Team.find();
    if (teams.length < 30) {
      console.log('Team data incomplete, refreshing...');
      await dataService.refreshTeamData();
    }
    
    // Check for upcoming games
    const today = new Date();
    const upcomingGames = await Game.find({
      date: { $gte: today },
      status: 'Scheduled'
    });
    
    if (upcomingGames.length === 0) {
      console.log('No upcoming games found, refreshing game data...');
      await dataService.updateGameData();
    }
    
    // Check for missing predictions
    const gamesWithoutPredictions = await Game.find({
      date: { $gte: today },
      status: 'Scheduled',
      'predictions.predictedWinner': { $exists: false }
    });
    
    if (gamesWithoutPredictions.length > 0) {
      console.log(`Found ${gamesWithoutPredictions.length} games without predictions, generating...`);
      await predictionService.generatePredictions();
    }
    
    console.log('Data recovery completed successfully');
  } catch (error) {
    console.error('Error during data recovery:', error);
  }
}

// Run recovery process
recoverData();
```

## Launch Checklist

### Pre-Launch Verification

1. **Backend Verification**
   - [ ] API endpoints return expected data
   - [ ] Authentication works correctly
   - [ ] Data processing jobs run on schedule
   - [ ] Error handling works as expected
   - [ ] Database connections are stable

2. **Frontend Verification**
   - [ ] Application loads correctly on all target devices
   - [ ] All pages render without errors
   - [ ] User interactions work as expected
   - [ ] Responsive design functions correctly
   - [ ] No console errors or warnings

3. **Data Verification**
   - [ ] NBA game data is accurate and up-to-date
   - [ ] Predictions are generated for all upcoming games
   - [ ] Parlay suggestions are reasonable
   - [ ] Team and player statistics are accurate

4. **Performance Verification**
   - [ ] Page load time is under 3 seconds
   - [ ] API response time is under 500ms
   - [ ] Application remains responsive during data loading
   - [ ] No memory leaks during extended use

### Launch Steps

1. **Final Deployment**
   - [ ] Deploy latest backend code to Render
   - [ ] Deploy latest frontend code to Netlify
   - [ ] Verify all environment variables are set correctly
   - [ ] Run database initialization and seeding scripts

2. **Monitoring Setup**
   - [ ] Configure uptime monitoring
   - [ ] Set up error alerting
   - [ ] Verify logging is working correctly
   - [ ] Test alert notifications

3. **Documentation**
   - [ ] Update API documentation
   - [ ] Document deployment procedures
   - [ ] Create user guide
   - [ ] Document recovery procedures

4. **Announcement**
   - [ ] Prepare launch announcement
   - [ ] Share application URL with stakeholders
   - [ ] Collect initial feedback

## Post-Launch Activities

1. **Monitoring and Support**
   - Monitor application performance and uptime
   - Address any issues or bugs reported by users
   - Provide support for any questions or concerns

2. **Data Validation**
   - Verify prediction accuracy against actual game results
   - Adjust models based on performance
   - Ensure data updates are occurring as scheduled

3. **User Feedback Collection**
   - Collect feedback on user experience
   - Identify pain points and areas for improvement
   - Prioritize enhancements for future iterations

4. **Performance Optimization**
   - Analyze application performance metrics
   - Identify bottlenecks and optimization opportunities
   - Implement critical performance improvements

## Budget Tracking

| Category | Allocated | Spent | Remaining |
|----------|-----------|-------|-----------|
| Cloud hosting | $250 | $0 (using free tiers) | $250 |
| Data API access | $350 | $150 (minimal tier) | $200 |
| Development tools | $100 | $49 (UI kit) | $51 |
| Design assets | $150 | $0 (using free assets) | $150 |
| Testing tools | $0 | $0 (using free tools) | $0 |
| Monitoring | $0 | $0 (using free tier) | $0 |
| Contingency | $150 | $0 | $150 |
| **Total** | **$1,000** | **$199** | **$801** |

## Conclusion

This deployment and testing plan provides a comprehensive approach to launching our NBA predictive betting model MVP. By following a systematic process for deployment, testing, and monitoring, we can ensure a smooth launch while staying within our budget constraints.

The plan prioritizes thorough testing at all levels, from unit tests to end-to-end validation, to ensure the quality and reliability of our application. By leveraging free tiers of cloud services and open-source tools, we've been able to minimize costs while still delivering a professional-grade deployment.

With careful monitoring and maintenance procedures in place, we'll be able to quickly identify and address any issues that arise post-launch, ensuring a positive experience for users of our MVP.
