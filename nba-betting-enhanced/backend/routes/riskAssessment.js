// backend/routes/riskAssessment.js
const express = require('express');
const router = express.Router();

// Sample risk assessment questionnaire
const questionnaire = {
  id: '1',
  title: 'Betting Risk Profile Assessment',
  description: 'Answer these questions to help us determine your risk tolerance and provide personalized betting recommendations.',
  questions: [
    {
      id: '1',
      text: 'How much experience do you have with sports betting?',
      type: 'single-choice',
      options: [
        { id: '1a', text: 'None - I\'m completely new', value: 1 },
        { id: '1b', text: 'Beginner - I\'ve placed a few bets', value: 2 },
        { id: '1c', text: 'Intermediate - I bet regularly', value: 3 },
        { id: '1d', text: 'Advanced - I\'m very experienced', value: 4 }
      ]
    },
    {
      id: '2',
      text: 'What is your primary goal with sports betting?',
      type: 'single-choice',
      options: [
        { id: '2a', text: 'Entertainment and fun', value: 1 },
        { id: '2b', text: 'Occasional wins while enjoying games', value: 2 },
        { id: '2c', text: 'Consistent supplemental income', value: 3 },
        { id: '2d', text: 'Maximum returns on investment', value: 4 }
      ]
    },
    {
      id: '3',
      text: 'How would you react to losing 5 bets in a row?',
      type: 'single-choice',
      options: [
        { id: '3a', text: 'I would stop betting for a while', value: 1 },
        { id: '3b', text: 'I would reduce my bet sizes', value: 2 },
        { id: '3c', text: 'I would continue with my strategy', value: 3 },
        { id: '3d', text: 'I would increase my bets to recover losses', value: 4 }
      ]
    },
    {
      id: '4',
      text: 'What percentage of your monthly entertainment budget are you comfortable allocating to betting?',
      type: 'single-choice',
      options: [
        { id: '4a', text: 'Less than 5%', value: 1 },
        { id: '4b', text: 'Between 5-15%', value: 2 },
        { id: '4c', text: 'Between 15-30%', value: 3 },
        { id: '4d', text: 'More than 30%', value: 4 }
      ]
    },
    {
      id: '5',
      text: 'Which betting approach do you prefer?',
      type: 'single-choice',
      options: [
        { id: '5a', text: 'Safe bets with low returns', value: 1 },
        { id: '5b', text: 'Moderate risk with moderate returns', value: 2 },
        { id: '5c', text: 'Higher risk with higher potential returns', value: 3 },
        { id: '5d', text: 'High risk parlays with maximum returns', value: 4 }
      ]
    }
  ]
};

// Get questionnaire
router.get('/', (req, res) => {
  res.json(questionnaire);
});

// Submit questionnaire responses
router.post('/submit', (req, res) => {
  const { userId, responses } = req.body;
  
  // Calculate risk score (simple average for demo)
  const totalScore = responses.reduce((sum, response) => sum + response.value, 0);
  const averageScore = totalScore / responses.length;
  
  let riskProfile;
  if (averageScore < 1.75) {
    riskProfile = 'Conservative';
  } else if (averageScore < 2.5) {
    riskProfile = 'Moderate';
  } else if (averageScore < 3.25) {
    riskProfile = 'Aggressive';
  } else {
    riskProfile = 'Very Aggressive';
  }
  
  // In a real app, we would save this to the user's profile in the database
  res.json({
    userId,
    riskProfile,
    riskScore: averageScore,
    recommendations: {
      maxBetSize: `$${Math.round(50 * averageScore)}`,
      suggestedBetTypes: riskProfile === 'Conservative' ? ['Moneyline', 'Under'] :
                         riskProfile === 'Moderate' ? ['Spread', 'Over/Under'] :
                         riskProfile === 'Aggressive' ? ['Parlays (2-3 legs)', 'Player Props'] :
                         ['Parlays (4+ legs)', 'Same Game Parlays', 'Futures']
    }
  });
});

module.exports = router;
