// backend/routes/games.js
const express = require('express');
const router = express.Router();

// Sample game data
const sampleGames = [
  {
    id: '1',
    homeTeam: {
      id: '1',
      name: 'Lakers',
      city: 'Los Angeles',
      abbreviation: 'LAL',
      logo: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
      score: 105
    },
    awayTeam: {
      id: '2',
      name: 'Celtics',
      city: 'Boston',
      abbreviation: 'BOS',
      logo: 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg',
      score: 102
    },
    status: 'In Progress',
    quarter: 4,
    timeRemaining: '5:30',
    odds: {
      spread: -3.5,
      total: 220.5,
      homeMoneyline: -150,
      awayMoneyline: +130
    },
    predictions: {
      homeWinProbability: 0.65,
      predictedTotal: 218,
      predictedSpread: -4
    }
  },
  {
    id: '2',
    homeTeam: {
      id: '3',
      name: 'Warriors',
      city: 'Golden State',
      abbreviation: 'GSW',
      logo: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',
      score: 0
    },
    awayTeam: {
      id: '4',
      name: 'Nets',
      city: 'Brooklyn',
      abbreviation: 'BKN',
      logo: 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg',
      score: 0
    },
    status: 'Scheduled',
    startTime: '2025-04-02T19:30:00Z',
    odds: {
      spread: -5.5,
      total: 235.5,
      homeMoneyline: -200,
      awayMoneyline: +170
    },
    predictions: {
      homeWinProbability: 0.72,
      predictedTotal: 232,
      predictedSpread: -6
    }
  }
];

// Get all games
router.get('/', (req, res)   => {
  res.json(sampleGames);
});

// Get active games - Add this new endpoint
router.get('/active', (req, res) => {
  // Filter games that are active (In Progress)
  const activeGames = sampleGames.filter(game => game.status === 'In Progress');
  res.json(activeGames);
});

// Get game by ID
router.get('/:id', (req, res) => {
  const game = sampleGames.find(g => g.id === req.params.id);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }
  res.json(game);
});

module.exports = router;
