// services/predictionService.js - Service for real-time game predictions

const Game = require('../models/Game');
const { gameNamespace } = require('../server');

class PredictionService {
  constructor() {
    // Constants for prediction models
    this.HOME_COURT_ADVANTAGE = 3.0;  // Average NBA home court advantage in points
    this.SCORE_STD_DEV = 12.0;  // Standard deviation of NBA game scores
    this.LEAGUE_AVERAGE_PACE = 100.0;  // Possessions per 48 minutes
    this.LEAGUE_AVERAGE_RATING = 110.0;  // Points per 100 possessions
    
    // Team ratings (simplified for MVP - would be loaded from database in production)
    this.teamRatings = {
      'Atlanta Hawks': 0,
      'Boston Celtics': 5,
      'Brooklyn Nets': 0,
      'Charlotte Hornets': -3,
      'Chicago Bulls': -2,
      'Cleveland Cavaliers': 3,
      'Dallas Mavericks': 4,
      'Denver Nuggets': 4,
      'Detroit Pistons': -5,
      'Golden State Warriors': 2,
      'Houston Rockets': -3,
      'Indiana Pacers': 0,
      'Los Angeles Clippers': 2,
      'Los Angeles Lakers': 1,
      'Memphis Grizzlies': 1,
      'Miami Heat': 2,
      'Milwaukee Bucks': 4,
      'Minnesota Timberwolves': 3,
      'New Orleans Pelicans': 0,
      'New York Knicks': 2,
      'Oklahoma City Thunder': 3,
      'Orlando Magic': -1,
      'Philadelphia 76ers': 3,
      'Phoenix Suns': 3,
      'Portland Trail Blazers': -4,
      'Sacramento Kings': 1,
      'San Antonio Spurs': -2,
      'Toronto Raptors': -1,
      'Utah Jazz': -3,
      'Washington Wizards': -4
    };
    
    // Team pace factors (simplified for MVP)
    this.teamPace = {
      'Atlanta Hawks': 102,
      'Boston Celtics': 98,
      'Brooklyn Nets': 99,
      'Charlotte Hornets': 101,
      'Chicago Bulls': 97,
      'Cleveland Cavaliers': 96,
      'Dallas Mavericks': 97,
      'Denver Nuggets': 98,
      'Detroit Pistons': 100,
      'Golden State Warriors': 103,
      'Houston Rockets': 102,
      'Indiana Pacers': 104,
      'Los Angeles Clippers': 99,
      'Los Angeles Lakers': 101,
      'Memphis Grizzlies': 100,
      'Miami Heat': 97,
      'Milwaukee Bucks': 102,
      'Minnesota Timberwolves': 100,
      'New Orleans Pelicans': 99,
      'New York Knicks': 96,
      'Oklahoma City Thunder': 100,
      'Orlando Magic': 98,
      'Philadelphia 76ers': 97,
      'Phoenix Suns': 100,
      'Portland Trail Blazers': 99,
      'Sacramento Kings': 102,
      'San Antonio Spurs': 100,
      'Toronto Raptors': 98,
      'Utah Jazz': 99,
      'Washington Wizards': 101
    };
    
    // Team offensive ratings (simplified for MVP)
    this.teamOffensiveRating = {
      'Atlanta Hawks': 112,
      'Boston Celtics': 118,
      'Brooklyn Nets': 113,
      'Charlotte Hornets': 109,
      'Chicago Bulls': 112,
      'Cleveland Cavaliers': 115,
      'Dallas Mavericks': 116,
      'Denver Nuggets': 117,
      'Detroit Pistons': 108,
      'Golden State Warriors': 116,
      'Houston Rockets': 110,
      'Indiana Pacers': 115,
      'Los Angeles Clippers': 115,
      'Los Angeles Lakers': 114,
      'Memphis Grizzlies': 114,
      'Miami Heat': 113,
      'Milwaukee Bucks': 117,
      'Minnesota Timberwolves': 115,
      'New Orleans Pelicans': 114,
      'New York Knicks': 115,
      'Oklahoma City Thunder': 116,
      'Orlando Magic': 111,
      'Philadelphia 76ers': 115,
      'Phoenix Suns': 116,
      'Portland Trail Blazers': 109,
      'Sacramento Kings': 116,
      'San Antonio Spurs': 110,
      'Toronto Raptors': 112,
      'Utah Jazz': 110,
      'Washington Wizards': 111
    };
    
    // Team defensive ratings (simplified for MVP)
    this.teamDefensiveRating = {
      'Atlanta Hawks': 115,
      'Boston Celtics': 110,
      'Brooklyn Nets': 114,
      'Charlotte Hornets': 116,
      'Chicago Bulls': 115,
      'Cleveland Cavaliers': 110,
      'Dallas Mavericks': 112,
      'Denver Nuggets': 112,
      'Detroit Pistons': 118,
      'Golden State Warriors': 113,
      'Houston Rockets': 116,
      'Indiana Pacers': 117,
      'Los Angeles Clippers': 112,
      'Los Angeles Lakers': 113,
      'Memphis Grizzlies': 113,
      'Miami Heat': 112,
      'Milwaukee Bucks': 111,
      'Minnesota Timberwolves': 110,
      'New Orleans Pelicans': 113,
      'New York Knicks': 111,
      'Oklahoma City Thunder': 111,
      'Orlando Magic': 113,
      'Philadelphia 76ers': 111,
      'Phoenix Suns': 112,
      'Portland Trail Blazers': 117,
      'Sacramento Kings': 115,
      'San Antonio Spurs': 116,
      'Toronto Raptors': 114,
      'Utah Jazz': 117,
      'Washington Wizards': 117
    };
  }
  
  // Process game update and generate predictions
  async processGameUpdate(game) {
    try {
      // Generate predictions
      const winProbability = this.predictWinProbability(game);
      const projectedSpread = this.predictPointSpread(game);
      const projectedTotal = this.predictTotalScore(game);
      
      // Update game with predictions
      const updatedGame = await Game.findOneAndUpdate(
        { gameId: game.gameId },
        {
          'predictions.currentWinProbability': {
            home: winProbability.homeWinProbability,
            away: winProbability.awayWinProbability,
            confidence: winProbability.confidence,
            lastUpdated: new Date()
          },
          'predictions.projectedSpread': {
            value: projectedSpread.spread,
            confidence: projectedSpread.confidence,
            lastUpdated: new Date()
          },
          'predictions.projectedTotal': {
            value: projectedTotal.total,
            confidence: projectedTotal.confidence,
            lastUpdated: new Date()
          },
          $push: {
            'predictions.history': {
              timestamp: new Date(),
              homeWinProbability: winProbability.homeWinProbability,
              awayWinProbability: winProbability.awayWinProbability,
              projectedSpread: projectedSpread.spread,
              projectedTotal: projectedTotal.total
            }
          }
        },
        { new: true }
      );
      
      // Emit updated predictions to clients
      if (updatedGame) {
        gameNamespace.to(`game:${game.gameId}`).emit('prediction_update', {
          gameId: game.gameId,
          predictions: {
            winProbability: {
              home: winProbability.homeWinProbability,
              away: winProbability.awayWinProbability,
              confidence: winProbability.confidence
            },
            spread: {
              value: projectedSpread.spread,
              confidence: projectedSpread.confidence
            },
            total: {
              value: projectedTotal.total,
              confidence: projectedTotal.confidence
            }
          },
          timestamp: new Date()
        });
      }
      
      return updatedGame;
    } catch (error) {
      console.error(`Error processing predictions for game ${game.gameId}:`, error);
      throw error;
    }
  }
  
  // Predict win probability using Bayesian model
  predictWinProbability(game) {
    // Extract game state variables
    const homeTeam = game.homeTeam.name;
    const awayTeam = game.awayTeam.name;
    const scoreDiff = game.homeTeam.score - game.awayTeam.score;
    const totalGameTime = 48 * 60;  // 48 minutes in regulation
    
    // Calculate time remaining (including potential overtime)
    let timeRemaining = 0;
    if (game.period <= 4) {
      timeRemaining = (5 - game.period) * 12 * 60 + game.timeRemaining;
    } else {
      timeRemaining = game.timeRemaining;
    }
    
    // Calculate time elapsed
    const timeElapsed = totalGameTime - timeRemaining;
    
    // Get pre-game team strength differential
    let preGameDiff = this.HOME_COURT_ADVANTAGE;
    if (this.teamRatings[homeTeam] !== undefined && this.teamRatings[awayTeam] !== undefined) {
      preGameDiff = this.teamRatings[homeTeam] - this.teamRatings[awayTeam] + this.HOME_COURT_ADVANTAGE;
    }
    
    // Calculate expected final score differential
    let expectedFinalDiff = preGameDiff;
    if (timeElapsed > 0) {
      // Weight current score difference more as game progresses
      const gameProgress = Math.min(1.0, timeElapsed / totalGameTime);
      expectedFinalDiff = (scoreDiff / gameProgress) * (1 - gameProgress) + scoreDiff;
    }
    
    // Adjust for time remaining uncertainty
    let remainingStdDev = this.SCORE_STD_DEV;
    if (timeRemaining > 0) {
      // More uncertainty with more time remaining
      remainingStdDev = this.SCORE_STD_DEV * Math.sqrt(timeRemaining / totalGameTime);
    } else {
      // No uncertainty if game is over
      remainingStdDev = 0.1;  // Small non-zero value to avoid division by zero
    }
    
    // Calculate win probability using normal distribution
    const homeWinProb = 1 - this._normalCDF(0, expectedFinalDiff, remainingStdDev);
    
    // Ensure probabilities are within bounds
    const homeWinProbability = Math.max(0.001, Math.min(0.999, homeWinProb));
    const awayWinProbability = 1 - homeWinProbability;
    
    // Calculate confidence based on time remaining
    const confidence = 1.0 - (remainingStdDev / this.SCORE_STD_DEV);
    
    return {
      homeWinProbability,
      awayWinProbability,
      expectedFinalDiff,
      confidence
    };
  }
  
  // Predict point spread
  predictPointSpread(game) {
    // Use win probability prediction as base
    const winProb = this.predictWinProbability(game);
    
    // Point spread is essentially the expected final score differential
    const spread = Math.round(winProb.expectedFinalDiff * 2) / 2; // Round to nearest 0.5
    
    return {
      spread,
      confidence: winProb.confidence
    };
  }
  
  // Predict total score
  predictTotalScore(game) {
    // Extract game state variables
    const homeTeam = game.homeTeam.name;
    const awayTeam = game.awayTeam.name;
    const currentTotal = game.homeTeam.score + game.awayTeam.score;
    
    // Calculate time remaining and elapsed
    const totalGameTime = 48 * 60;  // 48 minutes in regulation
    let timeRemaining = 0;
    if (game.period <= 4) {
      timeRemaining = (5 - game.period) * 12 * 60 + game.timeRemaining;
    } else {
      // Add overtime to total game time
      const overtimePeriods = game.period - 4;
      timeRemaining = game.timeRemaining;
    }
    
    // Calculate time elapsed
    const timeElapsed = totalGameTime - Math.min(totalGameTime, timeRemaining);
    const gameProgress = timeElapsed / totalGameTime;
    
    // Get team pace and efficiency ratings
    const homePace = this.teamPace[homeTeam] || this.LEAGUE_AVERAGE_PACE;
    const awayPace = this.teamPace[awayTeam] || this.LEAGUE_AVERAGE_PACE;
    const homeOffRtg = this.teamOffensiveRating[homeTeam] || this.LEAGUE_AVERAGE_RATING;
    const awayOffRtg = this.teamOffensiveRating[awayTeam] || this.LEAGUE_AVERAGE_RATING;
    const homeDefRtg = this.teamDefensiveRating[homeTeam] || this.LEAGUE_AVERAGE_RATING;
    const awayDefRtg = this.teamDefensiveRating[awayTeam] || this.LEAGUE_AVERAGE_RATING;
    
    // Calculate expected game pace (possessions per 48 minutes)
    const gamePace = (homePace + awayPace) / 2;
    
    // Calculate expected points per possession for each team
    const homePPP = (homeOffRtg / 100) * (awayDefRtg / this.LEAGUE_AVERAGE_RATING);
    const awayPPP = (awayOffRtg / 100) * (homeDefRtg / this.LEAGUE_AVERAGE_RATING);
    
    // Calculate expected total possessions for the game
    const totalPossessions = gamePace * (totalGameTime / (48 * 60));
    const remainingPossessions = totalPossessions * (timeRemaining / totalGameTime);
    
    // Calculate expected remaining points
    const expectedRemainingPoints = (homePPP + awayPPP) * remainingPossessions;
    
    // Calculate expected total score
    const expectedTotalScore = currentTotal + expectedRemainingPoints;
    
    // Round to nearest 0.5
    const total = Math.round(expectedTotalScore * 2) / 2;
    
    // Confidence decreases with more time remaining
    const confidence = Math.min(0.95, gameProgress + 0.2);
    
    return {
      total,
      confidence
    };
  }
  
  // Helper: Normal cumulative distribution function
  _normalCDF(x, mean, stdDev) {
    const z = (x - mean) / stdDev;
    return 0.5 * (1 + this._erf(z / Math.sqrt(2)));
  }
  
  // Helper: Error function approximation
  _erf(x) {
    // Constants
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    // Save the sign of x
    const sign = (x < 0) ? -1 : 1;
    x = Math.abs(x);
    
    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
}

module.exports = new PredictionService();
