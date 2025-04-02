// services/riskAssessmentService.js - Service for user risk profiling

const UserProfile = require('../models/UserProfile');

class RiskAssessmentService {
  constructor() {
    this.questions = [
      {
        id: 'betting_frequency',
        text: 'How often do you typically place bets?',
        options: [
          { value: 1, text: 'Rarely (a few times a year)', score: 1 },
          { value: 2, text: 'Occasionally (monthly)', score: 3 },
          { value: 3, text: 'Regularly (weekly)', score: 6 },
          { value: 4, text: 'Frequently (multiple times per week)', score: 8 },
          { value: 5, text: 'Daily', score: 10 }
        ]
      },
      {
        id: 'bet_size',
        text: 'What percentage of your betting budget would you be comfortable risking on a single bet?',
        options: [
          { value: 1, text: '1-2% (very conservative)', score: 1 },
          { value: 2, text: '3-5% (conservative)', score: 3 },
          { value: 3, text: '6-10% (moderate)', score: 5 },
          { value: 4, text: '11-20% (aggressive)', score: 8 },
          { value: 5, text: '21%+ (very aggressive)', score: 10 }
        ]
      },
      {
        id: 'parlay_preference',
        text: 'When it comes to parlays, which best describes your preference?',
        options: [
          { value: 1, text: 'I avoid parlays completely', score: 1 },
          { value: 2, text: 'I prefer 2-leg parlays with high probability', score: 3 },
          { value: 3, text: 'I like 3-4 leg parlays with moderate odds', score: 6 },
          { value: 4, text: 'I enjoy 5+ leg parlays for the bigger payouts', score: 9 },
          { value: 5, text: 'The more legs the better - I want huge paydays', score: 10 }
        ]
      },
      {
        id: 'losing_streak',
        text: 'How would you react to a 5-bet losing streak?',
        options: [
          { value: 1, text: 'Stop betting for a while to reassess', score: 1 },
          { value: 2, text: 'Reduce my bet size significantly', score: 3 },
          { value: 3, text: 'Continue with slightly smaller bets', score: 5 },
          { value: 4, text: 'Maintain my regular betting pattern', score: 7 },
          { value: 5, text: 'Increase my bets to recover losses faster', score: 10 }
        ]
      },
      {
        id: 'odds_preference',
        text: 'Which type of odds do you generally prefer?',
        options: [
          { value: 1, text: 'Heavy favorites (-200 or higher)', score: 2 },
          { value: 2, text: 'Moderate favorites (-120 to -190)', score: 4 },
          { value: 3, text: 'Near even odds (-110 to +110)', score: 6 },
          { value: 4, text: 'Moderate underdogs (+120 to +200)', score: 8 },
          { value: 5, text: 'Heavy underdogs (+250 or higher)', score: 10 }
        ]
      }
    ];
  }
  
  // Get questionnaire
  getQuestionnaire() {
    return this.questions;
  }
  
  // Process questionnaire responses and create initial risk profile
  async processQuestionnaire(userId, responses, budgetInfo) {
    try {
      // Calculate risk score
      let totalScore = 0;
      let totalQuestions = 0;
      
      for (const response of responses) {
        const question = this.questions.find(q => q.id === response.questionId);
        if (question) {
          const option = question.options.find(o => o.value === response.value);
          if (option) {
            totalScore += option.score;
            totalQuestions++;
          }
        }
      }
      
      // Calculate average risk score (1-10 scale)
      const riskScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 5;
      
      // Determine risk category
      let riskCategory = 'Moderate';
      if (riskScore <= 3) {
        riskCategory = 'Conservative';
      } else if (riskScore >= 8) {
        riskCategory = 'Aggressive';
      }
      
      // Set max bet percentage based on risk score
      const maxBetPercentage = Math.max(2, Math.min(25, riskScore * 2));
      
      // Create or update user profile
      const userProfile = await UserProfile.findOneAndUpdate(
        { userId },
        {
          riskProfile: {
            appetite: riskScore,
            category: riskCategory,
            volatilityTolerance: riskScore,
            lastUpdated: new Date()
          },
          budget: {
            amount: budgetInfo.amount,
            period: budgetInfo.period,
            maxBetPercentage: maxBetPercentage,
            lossLimit: budgetInfo.lossLimit || 0,
            currency: budgetInfo.currency || 'USD'
          },
          preferences: {
            betTypes: this._determineBetTypePreferences(responses),
            minOdds: this._determineMinOdds(responses),
            maxOdds: this._determineMaxOdds(responses),
            maxParlayLegs: this._determineMaxParlayLegs(responses)
          }
        },
        { new: true, upsert: true }
      );
      
      return userProfile;
    } catch (error) {
      console.error('Error processing risk questionnaire:', error);
      throw error;
    }
  }
  
  // Update risk profile based on betting behavior
  async updateRiskProfileFromBehavior(userId, bettingHistory) {
    try {
      // Get current profile
      const userProfile = await UserProfile.findOne({ userId });
      if (!userProfile) {
        throw new Error(`User profile not found for user ${userId}`);
      }
      
      // Analyze betting history
      const analysis = this._analyzeBettingBehavior(bettingHistory);
      
      // Adjust risk appetite based on behavior (max 1 point change at a time)
      let newAppetite = userProfile.riskProfile.appetite;
      if (analysis.riskScore > userProfile.riskProfile.appetite) {
        newAppetite = Math.min(10, userProfile.riskProfile.appetite + 1);
      } else if (analysis.riskScore < userProfile.riskProfile.appetite) {
        newAppetite = Math.max(1, userProfile.riskProfile.appetite - 1);
      }
      
      // Determine new risk category
      let newCategory = 'Moderate';
      if (newAppetite <= 3) {
        newCategory = 'Conservative';
      } else if (newAppetite >= 8) {
        newCategory = 'Aggressive';
      }
      
      // Update profile
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { userId },
        {
          'riskProfile.appetite': newAppetite,
          'riskProfile.category': newCategory,
          'riskProfile.lastUpdated': new Date(),
          'preferences.betTypes': analysis.preferredBetTypes,
          'preferences.minOdds': analysis.minOdds,
          'preferences.maxOdds': analysis.maxOdds,
          'preferences.maxParlayLegs': analysis.maxParlayLegs
        },
        { new: true }
      );
      
      return updatedProfile;
    } catch (error) {
      console.error(`Error updating risk profile for user ${userId}:`, error);
      throw error;
    }
  }
  
  // Get recommended bet sizes based on risk profile
  async getRecommendedBetSizes(userId) {
    try {
      const userProfile = await UserProfile.findOne({ userId });
      if (!userProfile) {
        throw new Error(`User profile not found for user ${userId}`);
      }
      
      return userProfile.getRecommendedBetSizes();
    } catch (error) {
      console.error(`Error getting recommended bet sizes for user ${userId}:`, error);
      throw error;
    }
  }
  
  // Helper: Determine bet type preferences from questionnaire
  _determineBetTypePreferences(responses) {
    const betTypes = ['moneyline', 'spread', 'total'];
    
    // Add parlay if user indicated interest
    const parlayResponse = responses.find(r => r.questionId === 'parlay_preference');
    if (parlayResponse && parlayResponse.value > 1) {
      betTypes.push('parlay');
    }
    
    return betTypes;
  }
  
  // Helper: Determine minimum odds from questionnaire
  _determineMinOdds(responses) {
    const oddsResponse = responses.find(r => r.questionId === 'odds_preference');
    if (!oddsResponse) return -200;
    
    switch (oddsResponse.value) {
      case 1: return -300;
      case 2: return -200;
      case 3: return -150;
      case 4: return -110;
      case 5: return +100;
      default: return -200;
    }
  }
  
  // Helper: Determine maximum odds from questionnaire
  _determineMaxOdds(responses) {
    const oddsResponse = responses.find(r => r.questionId === 'odds_preference');
    if (!oddsResponse) return 1000;
    
    switch (oddsResponse.value) {
      case 1: return 200;
      case 2: return 300;
      case 3: return 500;
      case 4: return 750;
      case 5: return 2000;
      default: return 1000;
    }
  }
  
  // Helper: Determine maximum parlay legs from questionnaire
  _determineMaxParlayLegs(responses) {
    const parlayResponse = responses.find(r => r.questionId === 'parlay_preference');
    if (!parlayResponse) return 4;
    
    switch (parlayResponse.value) {
      case 1: return 2;
      case 2: return 3;
      case 3: return 5;
      case 4: return 8;
      case 5: return 12;
      default: return 4;
    }
  }
  
  // Helper: Analyze betting behavior to determine risk profile
  _analyzeBettingBehavior(bettingHistory) {
    // Default values
    const result = {
      riskScore: 5,
      preferredBetTypes: ['moneyline', 'spread', 'total'],
      minOdds: -200,
      maxOdds: 1000,
      maxParlayLegs: 4
    };
    
    if (!bettingHistory || bettingHistory.length === 0) {
      return result;
    }
    
    // Count bet types
    const betTypeCounts = {
      moneyline: 0,
      spread: 0,
      total: 0,
      parlay: 0
    };
    
    // Track odds ranges
    let minOddsValue = Infinity;
    let maxOddsValue = -Infinity;
    let maxParlayLegsFound = 0;
    let totalRiskScore = 0;
    
    // Analyze each bet
    for (const bet of bettingHistory) {
      // Count bet type
      if (bet.type in betTypeCounts) {
        betTypeCounts[bet.type]++;
      }
      
      // Track odds ranges
      if (bet.odds < minOddsValue) minOddsValue = bet.odds;
      if (bet.odds > maxOddsValue) maxOddsValue = bet.odds;
      
      // Track parlay legs
      if (bet.type === 'parlay' && bet.legs && bet.legs.length > maxParlayLegsFound) {
        maxParlayLegsFound = bet.legs.length;
      }
      
      // Calculate risk score for this bet
      let betRiskScore = 5;
      
      // Adjust based on odds
      if (bet.odds <= -250) betRiskScore = 2;
      else if (bet.odds <= -150) betRiskScore = 3;
      else if (bet.odds <= -110) betRiskScore = 4;
      else if (bet.odds <= +150) betRiskScore = 6;
      else if (bet.odds <= +250) betRiskScore = 8;
      else betRiskScore = 10;
      
      // Adjust based on bet type
      if (bet.type === 'parlay') {
        betRiskScore += Math.min(5, bet.legs ? bet.legs.length - 1 : 0);
      }
      
      // Adjust based on bet size relative to bankroll
      if (bet.betSizePercentage) {
        if (bet.betSizePercentage <= 0.02) betRiskScore -= 2;
        else if (bet.betSizePercentage <= 0.05) betRiskScore -= 1;
        else if (bet.betSizePercentage >= 0.15) betRiskScore += 2;
        else if (bet.betSizePercentage >= 0.10) betRiskScore += 1;
      }
      
      // Ensure score is within range
      betRiskScore = Math.max(1, Math.min(10, betRiskScore));
      
      totalRiskScore += betRiskScore;
    }
    
    // Calculate average risk score
    result.riskScore = Math.round(totalRiskScore / bettingHistory.length);
    
    // Determine preferred bet types (those used more than 15% of the time)
    const totalBets = bettingHistory.length;
    result.preferredBetTypes = [];
    
    for (const [type, count] of Object.entries(betTypeCounts)) {
      if (count / totalBets >= 0.15) {
        result.preferredBetTypes.push(type);
      }
    }
    
    // Ensure at least one bet type
    if (result.preferredBetTypes.length === 0) {
      result.preferredBetTypes = ['moneyline'];
    }
    
    // Set min/max odds based on behavior
    if (minOddsValue !== Infinity) {
      result.minOdds = Math.floor(minOddsValue / 10) * 10; // Round to nearest 10
    }
    
    if (maxOddsValue !== -Infinity) {
      result.maxOdds = Math.ceil(maxOddsValue / 10) * 10; // Round to nearest 10
    }
    
    // Set max parlay legs
    if (maxParlayLegsFound > 0) {
      result.maxParlayLegs = maxParlayLegsFound;
    }
    
    return result;
  }
}

module.exports = new RiskAssessmentService();
