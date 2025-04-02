# Data Acquisition Strategy

## Overview

This document outlines our strategy for acquiring, processing, and storing NBA data for our predictive betting model MVP. Given our budget constraints (under $1,000), we'll implement a cost-effective approach that balances data quality with affordability.

## Data Requirements

### Essential Data Categories

1. **Game Data**
   - Schedule (upcoming games)
   - Historical results (past 2-3 seasons)
   - Game location
   - Rest days between games

2. **Team Statistics**
   - Offensive rating
   - Defensive rating
   - Pace
   - Effective field goal percentage
   - Rebounding percentages
   - Home/away performance
   - Recent form (last 10 games)

3. **Player Statistics**
   - Points per game
   - Rebounds per game
   - Assists per game
   - Minutes played
   - Efficiency metrics
   - Injury status

4. **Betting Information**
   - Moneyline odds
   - Point spreads
   - Over/under lines
   - Historical closing lines

## Data Sources

### Primary Sources

| Source | Data Type | Access Method | Cost | Update Frequency |
|--------|-----------|---------------|------|------------------|
| **NBA API** | Basic game data, schedules | REST API | Free | Daily |
| **RapidAPI Sports** | Enhanced team and player stats | REST API | $150-200/month (lowest tier) | Daily |
| **The Odds API** | Betting odds | REST API | Free tier (500 requests/month) | Daily |
| **ESPN API** | Supplementary data, news | REST API | Free | Daily |

### Backup/Alternative Sources

| Source | Data Type | Access Method | Cost | Notes |
|--------|-----------|---------------|------|-------|
| **Basketball Reference** | Historical statistics | Web scraping | Free | Fallback for historical data |
| **Sports Radar** | Comprehensive data | REST API | Trial available | Potential future upgrade |
| **Open source datasets** | Historical data | CSV/JSON files | Free | One-time import for model training |

## Data Acquisition Process

### 1. Initial Data Load

1. **Historical Data Collection**
   - Script to collect past 2-3 seasons of game results
   - Team performance metrics aggregation
   - Player statistics compilation
   - Historical betting odds collection (where available)

2. **Data Cleaning and Transformation**
   - Standardize team names and IDs across sources
   - Handle missing values
   - Convert data types
   - Create derived metrics

3. **Database Population**
   - Structure data according to schema
   - Bulk import to MongoDB
   - Validate data integrity
   - Create indexes for query optimization

### 2. Regular Updates

| Data Type | Update Frequency | Method | Trigger |
|-----------|------------------|--------|---------|
| Game schedule | Weekly | Automated API call | Scheduled task |
| Team statistics | Daily | Automated API call | Scheduled task |
| Player statistics | Daily | Automated API call | Scheduled task |
| Betting odds | 2-3 times daily | Automated API call | Scheduled task |
| Game results | Post-game | Automated API call | Event-based |

### 3. Data Processing Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Data       │────▶│  Data       │────▶│  Data       │────▶│  Database   │
│  Collection │     │  Processing │     │  Validation │     │  Storage    │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  API        │◀────│  Prediction │◀────│  Feature    │◀────│  Data       │
│  Endpoints  │     │  Model      │     │  Engineering│     │  Retrieval  │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Data Storage Strategy

### Database Schema

#### Collections

1. **Teams**
   ```json
   {
     "_id": "team_id",
     "name": "Team Name",
     "abbreviation": "TN",
     "conference": "East/West",
     "division": "Division Name",
     "stats": {
       "offensive_rating": 112.5,
       "defensive_rating": 108.2,
       "pace": 98.7,
       "efg_percentage": 0.54,
       "reb_percentage": 0.51
     },
     "recent_form": [
       {"game_id": "game123", "result": "W", "score": "105-98", "date": "2025-03-25"}
     ],
     "home_record": "15-10",
     "away_record": "12-13",
     "last_updated": "2025-04-01T12:00:00Z"
   }
   ```

2. **Players**
   ```json
   {
     "_id": "player_id",
     "name": "Player Name",
     "team_id": "team_id",
     "position": "PG",
     "stats": {
       "ppg": 18.5,
       "rpg": 4.2,
       "apg": 6.8,
       "mpg": 32.5,
       "efficiency": 15.7
     },
     "status": "Active/Injured",
     "injury_details": null,
     "last_updated": "2025-04-01T12:00:00Z"
   }
   ```

3. **Games**
   ```json
   {
     "_id": "game_id",
     "date": "2025-04-05T19:30:00Z",
     "home_team_id": "team_id1",
     "away_team_id": "team_id2",
     "status": "Scheduled/Completed",
     "result": {
       "home_score": 105,
       "away_score": 98
     },
     "location": "Arena Name",
     "betting_odds": {
       "spread": -5.5,
       "home_moneyline": -180,
       "away_moneyline": +160,
       "over_under": 220.5
     },
     "predictions": {
       "predicted_winner": "team_id1",
       "win_probability": 0.65,
       "predicted_spread": -4.8,
       "predicted_total": 218.7
     },
     "last_updated": "2025-04-01T12:00:00Z"
   }
   ```

4. **Parlays**
   ```json
   {
     "_id": "parlay_id",
     "name": "Suggested Parlay #1",
     "legs": [
       {
         "game_id": "game_id1",
         "bet_type": "spread",
         "team_id": "team_id1",
         "line": -5.5,
         "confidence": 0.72
       },
       {
         "game_id": "game_id2",
         "bet_type": "moneyline",
         "team_id": "team_id3",
         "line": +150,
         "confidence": 0.68
       }
     ],
     "combined_odds": +320,
     "combined_probability": 0.49,
     "date_created": "2025-04-01T12:00:00Z"
   }
   ```

### Optimization Strategies

1. **Selective Storage**
   - Store only data points relevant to our prediction model
   - Archive historical data after processing for features

2. **Caching Layer**
   - Cache frequently accessed data
   - Implement TTL (Time To Live) based on data type

3. **Aggregation**
   - Pre-calculate aggregated statistics
   - Store derived features to reduce computation

4. **Indexing**
   - Create indexes on frequently queried fields
   - Use compound indexes for common query patterns

## API Integration

### NBA API Integration

```javascript
// Example code for NBA API integration
const axios = require('axios');
const NBA_API_BASE_URL = 'https://data.nba.net/prod/v1';

async function fetchUpcomingGames() {
  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const response = await axios.get(`${NBA_API_BASE_URL}/scoreboard.json?gameDate=${today}`);
    return response.data.games.map(game => ({
      gameId: game.gameId,
      homeTeamId: game.hTeam.teamId,
      awayTeamId: game.vTeam.teamId,
      startTimeUTC: game.startTimeUTC,
      arena: game.arena.name,
      city: game.arena.city
    }));
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return [];
  }
}
```

### The Odds API Integration

```javascript
// Example code for The Odds API integration
const axios = require('axios');
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_URL = 'https://api.the-odds-api.com/v4/sports/basketball_nba/odds';

async function fetchBettingOdds() {
  try {
    const response = await axios.get(ODDS_API_URL, {
      params: {
        apiKey: ODDS_API_KEY,
        regions: 'us',
        markets: 'spreads,totals,h2h',
        oddsFormat: 'american'
      }
    });
    
    return response.data.map(game => ({
      gameId: mapGameIdFromTeamNames(game.home_team, game.away_team),
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      odds: {
        homeMoneyline: findHomeMoneyline(game.bookmakers),
        awayMoneyline: findAwayMoneyline(game.bookmakers),
        spread: findSpread(game.bookmakers),
        total: findTotal(game.bookmakers)
      },
      lastUpdated: new Date()
    }));
  } catch (error) {
    console.error('Error fetching betting odds:', error);
    return [];
  }
}
```

## Data Refresh Strategy

### Scheduled Updates

| Data Type | Frequency | Time | Priority |
|-----------|-----------|------|----------|
| Game schedule | Weekly | Monday 00:00 UTC | High |
| Team statistics | Daily | 09:00 UTC | Medium |
| Player statistics | Daily | 09:00 UTC | Medium |
| Betting odds | 3x Daily | 09:00, 15:00, 21:00 UTC | High |
| Game results | Post-game | Event-driven | High |

### Update Implementation

```javascript
// Example scheduled task using node-cron
const cron = require('node-cron');
const dataService = require('./services/dataService');

// Update betting odds three times daily
cron.schedule('0 9,15,21 * * *', async () => {
  console.log('Updating betting odds...');
  try {
    await dataService.updateBettingOdds();
    console.log('Betting odds updated successfully');
  } catch (error) {
    console.error('Error updating betting odds:', error);
  }
});

// Update team and player statistics daily
cron.schedule('0 9 * * *', async () => {
  console.log('Updating team and player statistics...');
  try {
    await dataService.updateTeamStats();
    await dataService.updatePlayerStats();
    console.log('Statistics updated successfully');
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
});
```

## Fallback Mechanisms

### API Failure Handling

1. **Retry Logic**
   - Implement exponential backoff for failed requests
   - Set maximum retry attempts

2. **Alternative Sources**
   - Switch to backup data sources when primary fails
   - Implement web scraping as last resort

3. **Cached Data**
   - Serve stale data with warning when fresh data unavailable
   - Prioritize critical updates

### Example Fallback Implementation

```javascript
async function fetchTeamStats(teamId) {
  try {
    // Try primary API
    return await primaryApiService.getTeamStats(teamId);
  } catch (primaryError) {
    console.error('Primary API failed:', primaryError);
    
    try {
      // Try secondary API
      return await secondaryApiService.getTeamStats(teamId);
    } catch (secondaryError) {
      console.error('Secondary API failed:', secondaryError);
      
      try {
        // Fall back to web scraping
        return await webScrapingService.getTeamStats(teamId);
      } catch (scrapingError) {
        console.error('Web scraping failed:', scrapingError);
        
        // Return cached data with timestamp
        const cachedData = await cacheService.getTeamStats(teamId);
        if (cachedData) {
          return {
            ...cachedData,
            isCached: true,
            cachedAt: cachedData.lastUpdated
          };
        }
        
        throw new Error('All data sources failed');
      }
    }
  }
}
```

## Data Quality Assurance

### Validation Rules

1. **Schema Validation**
   - Enforce data types and required fields
   - Validate ranges for numerical values

2. **Consistency Checks**
   - Cross-reference data between sources
   - Verify team totals match player aggregates

3. **Anomaly Detection**
   - Flag statistical outliers
   - Alert on unexpected data patterns

### Data Cleaning Process

1. **Standardization**
   - Normalize team and player names
   - Convert all timestamps to UTC

2. **Missing Data Handling**
   - Implement strategies for different fields:
     - Required fields: fallback to alternative sources
     - Optional fields: use default values or mark as unavailable

3. **Duplicate Detection**
   - Identify and merge duplicate records
   - Resolve conflicts using timestamp precedence

## Budget Considerations

### API Cost Management

- **The Odds API**: Stay within free tier (500 requests/month)
  - Batch requests where possible
  - Prioritize updates for imminent games

- **RapidAPI Sports**: Select minimum viable subscription tier
  - Focus on essential endpoints
  - Cache responses aggressively

### Storage Optimization

- **MongoDB Atlas**: Stay within free tier (512MB)
  - Implement data retention policies
  - Archive historical data after processing

### Compute Efficiency

- **Scheduled Jobs**: Optimize update frequency
  - Balance freshness with API call limits
  - Combine related updates in single jobs

## Implementation Timeline

| Week | Data Acquisition Tasks |
|------|------------------------|
| 1 | Set up database schema and API connections |
| 1 | Implement initial data load for historical data |
| 2 | Develop data processing and cleaning scripts |
| 2 | Create scheduled update jobs |
| 3 | Implement data validation and quality checks |
| 3 | Develop API endpoints for frontend consumption |
| 4 | Test and optimize data pipeline |
| 4 | Document data dictionary and API specifications |

## Conclusion

This data acquisition strategy provides a balanced approach to obtaining the necessary NBA data for our predictive betting model while staying within budget constraints. By leveraging free APIs where possible, implementing efficient data storage practices, and creating robust fallback mechanisms, we can ensure reliable data access while minimizing costs.

The strategy prioritizes the most critical data points for our prediction model while establishing a foundation that can be expanded as the product grows. Regular updates and quality assurance processes will ensure that our predictions are based on accurate, timely information.
