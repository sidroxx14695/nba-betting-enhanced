// services/nbaStatsService.js - Service for fetching and processing NBA game data

const axios = require('axios');
const Bull = require('bull');
const Game = require('../models/Game');

// Initialize data collection queue
const dataCollectionQueue = new Bull('nba-data-collection', process.env.REDIS_URL || 'redis://localhost:6379');

class NBAStatsService {
  constructor() {
    this.BASE_URL = 'https://data.nba.net/prod/v1';
    this.USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.activeGames = new Map();
    this.pollingInterval = null;
  }
  
  // Start polling for active games
  startPolling() {
    if (this.pollingInterval) {
      console.log('NBA stats polling already active');
      return;
    }
    
    console.log('Starting NBA stats polling');
    
    // Poll every 60 seconds for active games
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollActiveGames();
      } catch (error) {
        console.error('Error polling NBA active games:', error);
      }
    }, 60000);
    
    // Initial poll
    this.pollActiveGames();
  }
  
  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Stopped NBA stats polling');
    }
  }
  
  // Poll for active games
  async pollActiveGames() {
    try {
      // Get today's date in NBA API format (YYYYMMDD)
      const today = new Date();
      const formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      
      // Get today's scoreboard
      const scoreboardUrl = `${this.BASE_URL}/${formattedDate}/scoreboard.json`;
      const response = await axios.get(scoreboardUrl, {
        headers: {
          'User-Agent': this.USER_AGENT
        }
      });
      
      const games = response.data.games || [];
      
      // Process each game
      for (const game of games) {
        const gameId = game.gameId;
        const isActive = game.statusNum === 2; // 2 = in progress
        
        if (isActive) {
          // If game is active and we're not tracking it, start tracking
          if (!this.activeGames.has(gameId)) {
            console.log(`Found new active game: ${gameId}`);
            this.activeGames.set(gameId, {
              startTime: new Date(),
              lastUpdate: new Date(),
              updateCount: 0
            });
            
            // Start collecting detailed data for this game
            this.startGameDataCollection(gameId);
          }
        } else if (this.activeGames.has(gameId)) {
          // If game is no longer active but we're tracking it, stop tracking
          console.log(`Game ${gameId} is no longer active`);
          this.activeGames.delete(gameId);
        }
      }
      
      // Clean up any games we're tracking that aren't in today's scoreboard
      const currentGameIds = new Set(games.map(g => g.gameId));
      for (const trackedGameId of this.activeGames.keys()) {
        if (!currentGameIds.has(trackedGameId)) {
          console.log(`Removing stale game from tracking: ${trackedGameId}`);
          this.activeGames.delete(trackedGameId);
        }
      }
      
      return {
        activeGames: Array.from(this.activeGames.keys()),
        totalGames: games.length
      };
    } catch (error) {
      console.error('Error polling NBA active games:', error);
      throw error;
    }
  }
  
  // Start collecting detailed data for a specific game
  startGameDataCollection(gameId) {
    // Add to collection queue with high priority
    dataCollectionQueue.add('collectGameData', {
      gameId,
      source: 'nba-stats',
      timestamp: new Date()
    }, {
      priority: 1,
      repeat: {
        every: 15000, // 15 seconds
        limit: 1000 // Safety limit
      },
      jobId: `nba-stats-${gameId}` // Unique job ID to prevent duplicates
    });
    
    console.log(`Started data collection for game ${gameId}`);
  }
  
  // Collect detailed game data
  async collectGameData(gameId) {
    try {
      // Get boxscore data
      const boxscoreUrl = `${this.BASE_URL}/game/${gameId}/boxscore.json`;
      const response = await axios.get(boxscoreUrl, {
        headers: {
          'User-Agent': this.USER_AGENT
        }
      });
      
      const gameData = response.data;
      
      // Extract basic game info
      const basicGameData = gameData.basicGameData;
      const homeTeam = basicGameData.hTeam;
      const awayTeam = basicGameData.vTeam;
      
      // Create game object
      const gameUpdate = {
        gameId: gameId,
        season: basicGameData.seasonYear,
        date: new Date(basicGameData.startDateEastern),
        status: this._mapGameStatus(basicGameData.statusNum),
        period: parseInt(basicGameData.period.current),
        timeRemaining: this._convertClockToSeconds(basicGameData.clock),
        homeTeam: {
          teamId: homeTeam.teamId,
          name: this._getTeamNameById(homeTeam.teamId),
          abbreviation: homeTeam.triCode,
          score: parseInt(homeTeam.score),
          quarterScores: homeTeam.linescore.map(q => parseInt(q.score))
        },
        awayTeam: {
          teamId: awayTeam.teamId,
          name: this._getTeamNameById(awayTeam.teamId),
          abbreviation: awayTeam.triCode,
          score: parseInt(awayTeam.score),
          quarterScores: awayTeam.linescore.map(q => parseInt(q.score))
        },
        lastUpdated: new Date()
      };
      
      // Extract team stats if available
      if (gameData.stats && gameData.stats.hTeam && gameData.stats.vTeam) {
        const homeStats = gameData.stats.hTeam;
        const awayStats = gameData.stats.vTeam;
        
        // Add home team stats
        gameUpdate.homeTeam.stats = {
          fieldGoalsMade: parseInt(homeStats.fgm || 0),
          fieldGoalsAttempted: parseInt(homeStats.fga || 0),
          threePointsMade: parseInt(homeStats.tpm || 0),
          threePointsAttempted: parseInt(homeStats.tpa || 0),
          freeThrowsMade: parseInt(homeStats.ftm || 0),
          freeThrowsAttempted: parseInt(homeStats.fta || 0),
          rebounds: parseInt(homeStats.totReb || 0),
          assists: parseInt(homeStats.assists || 0),
          steals: parseInt(homeStats.steals || 0),
          blocks: parseInt(homeStats.blocks || 0),
          turnovers: parseInt(homeStats.turnovers || 0),
          fouls: parseInt(homeStats.pFouls || 0)
        };
        
        // Add away team stats
        gameUpdate.awayTeam.stats = {
          fieldGoalsMade: parseInt(awayStats.fgm || 0),
          fieldGoalsAttempted: parseInt(awayStats.fga || 0),
          threePointsMade: parseInt(awayStats.tpm || 0),
          threePointsAttempted: parseInt(awayStats.tpa || 0),
          freeThrowsMade: parseInt(awayStats.ftm || 0),
          freeThrowsAttempted: parseInt(awayStats.fta || 0),
          rebounds: parseInt(awayStats.totReb || 0),
          assists: parseInt(awayStats.assists || 0),
          steals: parseInt(awayStats.steals || 0),
          blocks: parseInt(awayStats.blocks || 0),
          turnovers: parseInt(awayStats.turnovers || 0),
          fouls: parseInt(awayStats.pFouls || 0)
        };
      }
      
      // Update game in database (upsert)
      const game = await Game.findOneAndUpdate(
        { gameId: gameId },
        gameUpdate,
        { new: true, upsert: true }
      );
      
      // Update tracking info
      if (this.activeGames.has(gameId)) {
        const trackingInfo = this.activeGames.get(gameId);
        trackingInfo.lastUpdate = new Date();
        trackingInfo.updateCount++;
        this.activeGames.set(gameId, trackingInfo);
      }
      
      return game;
    } catch (error) {
      console.error(`Error collecting data for game ${gameId}:`, error);
      throw error;
    }
  }
  
  // Helper: Convert clock string to seconds
  _convertClockToSeconds(clockString) {
    if (!clockString || clockString === '') return 0;
    
    const parts = clockString.split(':');
    if (parts.length !== 2) return 0;
    
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    
    return (minutes * 60) + seconds;
  }
  
  // Helper: Map NBA API status to our status
  _mapGameStatus(statusNum) {
    switch (statusNum) {
      case 1: return 'Scheduled';
      case 2: return 'In Progress';
      case 3: return 'Final';
      default: return 'Scheduled';
    }
  }
  
  // Helper: Get team name by ID (simplified for now)
  _getTeamNameById(teamId) {
    const teamNames = {
      '1610612737': 'Atlanta Hawks',
      '1610612738': 'Boston Celtics',
      '1610612739': 'Cleveland Cavaliers',
      '1610612740': 'New Orleans Pelicans',
      '1610612741': 'Chicago Bulls',
      '1610612742': 'Dallas Mavericks',
      '1610612743': 'Denver Nuggets',
      '1610612744': 'Golden State Warriors',
      '1610612745': 'Houston Rockets',
      '1610612746': 'Los Angeles Clippers',
      '1610612747': 'Los Angeles Lakers',
      '1610612748': 'Miami Heat',
      '1610612749': 'Milwaukee Bucks',
      '1610612750': 'Minnesota Timberwolves',
      '1610612751': 'Brooklyn Nets',
      '1610612752': 'New York Knicks',
      '1610612753': 'Orlando Magic',
      '1610612754': 'Indiana Pacers',
      '1610612755': 'Philadelphia 76ers',
      '1610612756': 'Phoenix Suns',
      '1610612757': 'Portland Trail Blazers',
      '1610612758': 'Sacramento Kings',
      '1610612759': 'San Antonio Spurs',
      '1610612760': 'Oklahoma City Thunder',
      '1610612761': 'Toronto Raptors',
      '1610612762': 'Utah Jazz',
      '1610612763': 'Memphis Grizzlies',
      '1610612764': 'Washington Wizards',
      '1610612765': 'Detroit Pistons',
      '1610612766': 'Charlotte Hornets'
    };
    
    return teamNames[teamId] || 'Unknown Team';
  }
}

module.exports = new NBAStatsService();
