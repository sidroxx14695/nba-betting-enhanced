// routes/api.js - API routes for the enhanced NBA betting MVP

const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const UserProfile = require('../models/UserProfile');
const nbaStatsService = require('../services/nbaStatsService');
const predictionService = require('../services/predictionService');
const riskAssessmentService = require('../services/riskAssessmentService');
const recommendationService = require('../services/recommendationService');

// Get all active games
router.get('/games/active', async (req, res) => {
  try {
    const activeGames = await Game.find({ status: 'In Progress' });
    res.json(activeGames);
  } catch (error) {
    console.error('Error fetching active games:', error);
    res.status(500).json({ error: 'Failed to fetch active games' });
  }
});

// Get game by ID
router.get('/games/:gameId', async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    console.error(`Error fetching game ${req.params.gameId}:`, error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Get game predictions
router.get('/games/:gameId/predictions', async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (!game.predictions) {
      return res.status(404).json({ error: 'No predictions available for this game' });
    }
    
    res.json(game.predictions);
  } catch (error) {
    console.error(`Error fetching predictions for game ${req.params.gameId}:`, error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// Get user profile
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const userProfile = await UserProfile.findOne({ userId: req.params.userId });
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(userProfile);
  } catch (error) {
    console.error(`Error fetching user profile for ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Create or update user profile from questionnaire
router.post('/users/:userId/profile', async (req, res) => {
  try {
    const { responses, budgetInfo } = req.body;
    
    if (!responses || !budgetInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const userProfile = await riskAssessmentService.processQuestionnaire(
      req.params.userId,
      responses,
      budgetInfo
    );
    
    res.json(userProfile);
  } catch (error) {
    console.error(`Error creating user profile for ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
});

// Get risk assessment questionnaire
router.get('/risk-assessment/questionnaire', (req, res) => {
  try {
    const questionnaire = riskAssessmentService.getQuestionnaire();
    res.json(questionnaire);
  } catch (error) {
    console.error('Error fetching risk assessment questionnaire:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
});

// Get recommended bet sizes for user
router.get('/users/:userId/bet-sizes', async (req, res) => {
  try {
    const betSizes = await riskAssessmentService.getRecommendedBetSizes(req.params.userId);
    res.json(betSizes);
  } catch (error) {
    console.error(`Error fetching bet sizes for user ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch recommended bet sizes' });
  }
});

// Get personalized recommendations for user
router.get('/users/:userId/recommendations', async (req, res) => {
  try {
    const recommendations = await recommendationService.generateRecommendations(req.params.userId);
    res.json(recommendations);
  } catch (error) {
    console.error(`Error generating recommendations for user ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Start NBA data polling (admin only)
router.post('/admin/start-polling', (req, res) => {
  try {
    nbaStatsService.startPolling();
    res.json({ message: 'NBA data polling started' });
  } catch (error) {
    console.error('Error starting NBA data polling:', error);
    res.status(500).json({ error: 'Failed to start NBA data polling' });
  }
});

// Stop NBA data polling (admin only)
router.post('/admin/stop-polling', (req, res) => {
  try {
    nbaStatsService.stopPolling();
    res.json({ message: 'NBA data polling stopped' });
  } catch (error) {
    console.error('Error stopping NBA data polling:', error);
    res.status(500).json({ error: 'Failed to stop NBA data polling' });
  }
});

module.exports = router;
