// services/recommendationService.js - Service for personalized betting recommendations

const UserProfile = require('../models/UserProfile');
const Game = require('../models/Game');
const { userNamespace } = require('../server');

class RecommendationService {
  constructor() {
    // Constants for recommendation engine
    this.MIN_WIN_PROBABILITY = 0.55; // Minimum win probability to recommend a bet
    this.MIN_CONFIDENCE = 0.6; // Minimum confidence level for recommendations
    this.MAX_PARLAY_COMBINATIONS = 10; // Maximum number of parlay combinations to recommend
  }
  
  // Generate personalized recommendations for a user
  async generateRecommendations(userId) {
    try {
      // Get user profile
      const userProfile = await UserProfile.findOne({ userId });
      if (!userProfile) {
        throw new Error(`User profile not found for user ${userId}`);
      }
      
      // Get active games with predictions
      const activeGames = await Game.find({ 
        status: 'In Progress',
        'predictions.currentWinProbability.confidence': { $gte: this.MIN_CONFIDENCE }
      });
      
      // Get recommended bet sizes
      const betSizes = userProfile.getRecommendedBetSizes();
      
      // Generate recommendations based on risk profile
      const recommendations = {
        singleBets: await this._generateSingleBetRecommendations(userProfile, activeGames, betSizes),
        parlays: await this._generateParlayRecommendations(userProfile, activeGames, betSizes)
      };
      
      // Emit recommendations to user
      userNamespace.to(`user:${userId}`).emit('recommendations_update', {
        userId,
        recommendations,
        timestamp: new Date()
      });
      
      return recommendations;
    } catch (error) {
      console.error(`Error generating recommendations for user ${userId}:`, error);
      throw error;
    }
  }
  
  // Generate single bet recommendations
  async _generateSingleBetRecommendations(userProfile, activeGames, betSizes) {
    const singleBets = [];
    const { appetite } = userProfile.riskProfile;
    const { betTypes, minOdds, maxOdds } = userProfile.preferences;
    
    // Adjust win probability threshold based on risk appetite
    // Higher risk appetite = lower threshold (more bets)
    const winProbabilityThreshold = this.MIN_WIN_PROBABILITY - ((appetite - 5) * 0.02);
    
    for (const game of activeGames) {
      // Check moneyline bets
      if (betTypes.includes('moneyline')) {
        // Home team moneyline
        if (game.predictions.currentWinProbability.home >= winProbabilityThreshold) {
          const homeOdds = game.odds.live?.homeMoneyline || game.odds.pregame?.homeMoneyline;
          if (homeOdds && homeOdds >= minOdds && homeOdds <= maxOdds) {
            singleBets.push({
              type: 'moneyline',
              gameId: game.gameId,
              team: 'home',
              teamName: game.homeTeam.name,
              odds: homeOdds,
              winProbability: game.predictions.currentWinProbability.home,
              confidence: game.predictions.currentWinProbability.confidence,
              recommendedStake: this._calculateRecommendedStake(
                game.predictions.currentWinProbability.home,
                game.predictions.currentWinProbability.confidence,
                betSizes.singleBet
              )
            });
          }
        }
        
        // Away team moneyline
        if (game.predictions.currentWinProbability.away >= winProbabilityThreshold) {
          const awayOdds = game.odds.live?.awayMoneyline || game.odds.pregame?.awayMoneyline;
          if (awayOdds && awayOdds >= minOdds && awayOdds <= maxOdds) {
            singleBets.push({
              type: 'moneyline',
              gameId: game.gameId,
              team: 'away',
              teamName: game.awayTeam.name,
              odds: awayOdds,
              winProbability: game.predictions.currentWinProbability.away,
              confidence: game.predictions.currentWinProbability.confidence,
              recommendedStake: this._calculateRecommendedStake(
                game.predictions.currentWinProbability.away,
                game.predictions.currentWinProbability.confidence,
                betSizes.singleBet
              )
            });
          }
        }
      }
      
      // Check spread bets
      if (betTypes.includes('spread')) {
        const spreadValue = game.predictions.projectedSpread.value;
        const spreadConfidence = game.predictions.projectedSpread.confidence;
        
        if (spreadConfidence >= this.MIN_CONFIDENCE) {
          // Determine if home or away team is the better spread bet
          const homeSpreadOdds = -110; // Simplified for MVP
          const awaySpreadOdds = -110; // Simplified for MVP
          
          // Home team spread
          if (spreadValue < -1) { // Home team favored by more than 1 point
            singleBets.push({
              type: 'spread',
              gameId: game.gameId,
              team: 'home',
              teamName: game.homeTeam.name,
              spreadValue: spreadValue,
              odds: homeSpreadOdds,
              confidence: spreadConfidence,
              recommendedStake: this._calculateRecommendedStake(
                0.55, // Simplified win probability for spread bets
                spreadConfidence,
                betSizes.singleBet
              )
            });
          }
          
          // Away team spread
          if (spreadValue > 1) { // Away team favored by more than 1 point
            singleBets.push({
              type: 'spread',
              gameId: game.gameId,
              team: 'away',
              teamName: game.awayTeam.name,
              spreadValue: -spreadValue,
              odds: awaySpreadOdds,
              confidence: spreadConfidence,
              recommendedStake: this._calculateRecommendedStake(
                0.55, // Simplified win probability for spread bets
                spreadConfidence,
                betSizes.singleBet
              )
            });
          }
        }
      }
      
      // Check total bets
      if (betTypes.includes('total')) {
        const totalValue = game.predictions.projectedTotal.value;
        const totalConfidence = game.predictions.projectedTotal.confidence;
        
        if (totalConfidence >= this.MIN_CONFIDENCE) {
          // Determine if over or under is the better bet
          // Simplified logic for MVP
          const overOdds = -110;
          const underOdds = -110;
          
          // For simplicity, recommend the over if the projected total is higher than pregame
          if (game.odds.pregame?.total && totalValue > game.odds.pregame.total) {
            singleBets.push({
              type: 'total',
              gameId: game.gameId,
              bet: 'over',
              totalValue: game.odds.pregame.total,
              projectedTotal: totalValue,
              odds: overOdds,
              confidence: totalConfidence,
              recommendedStake: this._calculateRecommendedStake(
                0.55, // Simplified win probability for total bets
                totalConfidence,
                betSizes.singleBet
              )
            });
          } else if (game.odds.pregame?.total && totalValue < game.odds.pregame.total) {
            singleBets.push({
              type: 'total',
              gameId: game.gameId,
              bet: 'under',
              totalValue: game.odds.pregame.total,
              projectedTotal: totalValue,
              odds: underOdds,
              confidence: totalConfidence,
              recommendedStake: this._calculateRecommendedStake(
                0.55, // Simplified win probability for total bets
                totalConfidence,
                betSizes.singleBet
              )
            });
          }
        }
      }
    }
    
    // Sort by confidence and win probability
    singleBets.sort((a, b) => {
      const aScore = (a.confidence || 0) * (a.winProbability || 0.5);
      const bScore = (b.confidence || 0) * (b.winProbability || 0.5);
      return bScore - aScore;
    });
    
    return singleBets;
  }
  
  // Generate parlay recommendations
  async _generateParlayRecommendations(userProfile, activeGames, betSizes) {
    const parlays = [];
    
    // Skip if user doesn't prefer parlays
    if (!userProfile.preferences.betTypes.includes('parlay')) {
      return parlays;
    }
    
    const { appetite } = userProfile.riskProfile;
    const { maxParlayLegs } = userProfile.preferences;
    
    // Adjust win probability threshold based on risk appetite
    // Higher risk appetite = lower threshold (more bets)
    const winProbabilityThreshold = this.MIN_WIN_PROBABILITY - ((appetite - 5) * 0.02);
    
    // Get potential parlay legs
    const potentialLegs = [];
    
    for (const game of activeGames) {
      // Home team moneyline
      if (game.predictions.currentWinProbability.home >= winProbabilityThreshold) {
        const homeOdds = game.odds.live?.homeMoneyline || game.odds.pregame?.homeMoneyline;
        if (homeOdds) {
          potentialLegs.push({
            type: 'moneyline',
            gameId: game.gameId,
            team: 'home',
            teamName: game.homeTeam.name,
            odds: homeOdds,
            winProbability: game.predictions.currentWinProbability.home,
            confidence: game.predictions.currentWinProbability.confidence
          });
        }
      }
      
      // Away team moneyline
      if (game.predictions.currentWinProbability.away >= winProbabilityThreshold) {
        const awayOdds = game.odds.live?.awayMoneyline || game.odds.pregame?.awayMoneyline;
        if (awayOdds) {
          potentialLegs.push({
            type: 'moneyline',
            gameId: game.gameId,
            team: 'away',
            teamName: game.awayTeam.name,
            odds: awayOdds,
            winProbability: game.predictions.currentWinProbability.away,
            confidence: game.predictions.currentWinProbability.confidence
          });
        }
      }
    }
    
    // Sort potential legs by confidence and win probability
    potentialLegs.sort((a, b) => {
      const aScore = a.confidence * a.winProbability;
      const bScore = b.confidence * b.winProbability;
      return bScore - aScore;
    });
    
    // Generate 2-leg parlays
    if (potentialLegs.length >= 2) {
      // Take top legs based on risk appetite
      // Higher risk appetite = more legs to consider
      const legsToConsider = Math.min(
        potentialLegs.length,
        5 + Math.floor(appetite / 2)
      );
      
      // Generate combinations
      for (let i = 0; i < legsToConsider - 1; i++) {
        for (let j = i + 1; j < legsToConsider; j++) {
          // Skip if both legs are from the same game
          if (potentialLegs[i].gameId === potentialLegs[j].gameId) {
            continue;
          }
          
          const legs = [potentialLegs[i], potentialLegs[j]];
          const combinedOdds = this._calculateParlayOdds(legs.map(leg => leg.odds));
          const combinedProbability = legs.reduce((prob, leg) => prob * leg.winProbability, 1);
          const combinedConfidence = legs.reduce((conf, leg) => conf * leg.confidence, 1);
          
          parlays.push({
            legs,
            combinedOdds,
            winProbability: combinedProbability,
            confidence: combinedConfidence,
            recommendedStake: this._calculateRecommendedStake(
              combinedProbability,
              combinedConfidence,
              betSizes.parlay
            )
          });
        }
      }
    }
    
    // Generate 3-leg parlays if user risk appetite is moderate or higher
    if (appetite >= 5 && potentialLegs.length >= 3 && maxParlayLegs >= 3) {
      // Take top legs based on risk appetite
      const legsToConsider = Math.min(
        potentialLegs.length,
        4 + Math.floor(appetite / 2)
      );
      
      // Generate combinations (limit to avoid too many)
      const maxCombinations = Math.min(5, this.MAX_PARLAY_COMBINATIONS);
      let combinationCount = 0;
      
      for (let i = 0; i < legsToConsider - 2; i++) {
        for (let j = i + 1; j < legsToConsider - 1; j++) {
          for (let k = j + 1; k < legsToConsider; k++) {
            // Skip if any legs are from the same game
            if (potentialLegs[i].gameId === potentialLegs[j].gameId ||
                potentialLegs[i].gameId === potentialLegs[k].gameId ||
                potentialLegs[j].gameId === potentialLegs[k].gameId) {
              continue;
            }
            
            const legs = [potentialLegs[i], potentialLegs[j], potentialLegs[k]];
            const combinedOdds = this._calculateParlayOdds(legs.map(leg => leg.odds));
            const combinedProbability = legs.reduce((prob, leg) => prob * leg.winProbability, 1);
            const combinedConfidence = legs.reduce((conf, leg) => conf * leg.confidence, 1);
            
            parlays.push({
              legs,
              combinedOdds,
              winProbability: combinedProbability,
              confidence: combinedConfidence,
              recommendedStake: this._calculateRecommendedStake(
                combinedProbability,
                combinedConfidence,
                betSizes.parlay
              )
            });
            
            combinationCount++;
            if (combinationCount >= maxCombinations) break;
          }
          if (combinationCount >= maxCombinations) break;
        }
        if (combinationCount >= maxCombinations) break;
      }
    }
    
    // Generate 4+ leg parlays only for aggressive risk profiles
    if (appetite >= 8 && potentialLegs.length >= 4 && maxParlayLegs >= 4) {
      // Simplified: just create one 4-leg parlay with the top legs
      const legs = potentialLegs.slice(0, 4);
      
      // Check if all legs are from different games
      const gameIds = new Set(legs.map(leg => leg.gameId));
      if (gameIds.size === 4) {
        const combinedOdds = this._calculateParlayOdds(legs.map(leg => leg.odds));
        const combinedProbability = legs.reduce((prob, leg) => prob * leg.winProbability, 1);
        const combinedConfidence = legs.reduce((conf, leg) => conf * leg.confidence, 1);
        
        parlays.push({
          legs,
          combinedOdds,
          winProbability: combinedProbability,
          confidence: combinedConfidence,
          recommendedStake: this._calculateRecommendedStake(
            combinedProbability,
            combinedConfidence,
            betSizes.parlay
          )
        });
      }
    }
    
    // Sort parlays by expected value
    parlays.sort((a, b) => {
      const aEV = (a.combinedOdds * a.winProbability) - 1;
      const bEV = (b.combinedOdds * b.winProbability) - 1;
      return bEV - aEV;
    });
    
    // Limit number of parlays based on risk appetite
    const maxParlays = Math.min(
      parlays.length,
      2 + Math.floor(appetite / 2)
    );
    
    return parlays.slice(0, maxParlays);
  }
  
  // Calculate recommended stake based on probability, confidence, and bet size range
  _calculateRecommendedStake(probability, confidence, betSizeRange) {
    // Higher probability and confidence = higher stake
    const combinedScore = probability * confidence;
    
    // Scale from min to max based on combined score
    // 0.5 combined score = min bet, 1.0 combined score = max bet
    const scaleFactor = Math.min(1, Math.max(0, (combinedScore - 0.5) * 2));
    
    // Calculate stake
    const stake = betSizeRange.min + (scaleFactor * (betSizeRange.max - betSizeRange.min));
    
    // Round to nearest whole number
    return Math.round(stake);
  }
  
  // Calculate combined odds for a parlay
  _calculateParlayOdds(oddsArray) {
    // Convert American odds to decimal
    const decimalOdds = oddsArray.map(odds => {
      if (odds > 0) {
        return 1 + (odds / 100);
      } else {
        return 1 + (100 / Math.abs(odds));
      }
    });
    
    // Multiply all decimal odds
    const combinedDecimal = decimalOdds.reduce((product, odds) => product * odds, 1);
    
    // Convert back to American odds
    if (combinedDecimal >= 2) {
      return Math.round((combinedDecimal - 1) * 100);
    } else {
      return Math.round(-100 / (combinedDecimal - 1));
    }
  }
}

module.exports = new RecommendationService();
