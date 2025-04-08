// src/services/balldontlieApi.ts
import axios from 'axios';

const BASE_URL = 'https://www.balldontlie.io/api/v1';

const balldontlieApiService = {
  // Get games by date (format: YYYY-MM-DD) 
  getGamesByDate: async (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    return axios.get(`${BASE_URL}/games`, {
      params: {
        'dates[]': formattedDate,
        per_page: 100
      }
    });
  },

  // Get all teams
  getTeams: async () => {
    return axios.get(`${BASE_URL}/teams`);
  },

  // Get game by ID
  getGameById: async (gameId: number) => {
    return axios.get(`${BASE_URL}/games/${gameId}`);
  },

  // Get player stats by game
  getStatsByGame: async (gameId: number) => {
    return axios.get(`${BASE_URL}/stats`, {
      params: {
        game_ids: [gameId],
        per_page: 100
      }
    });
  },

  // Get player by ID
  getPlayerById: async (playerId: number) => {
    return axios.get(`${BASE_URL}/players/${playerId}`);
  },

  // Search players
  searchPlayers: async (searchTerm: string) => {
    return axios.get(`${BASE_URL}/players`, {
      params: {
        search: searchTerm,
        per_page: 100
      }
    });
  },

  // Get season averages for player
  getSeasonAverages: async (playerId: number, season: number = 2024) => {
    return axios.get(`${BASE_URL}/season_averages`, {
      params: {
        player_ids: [playerId],
        season
      }
    });
  }
};

export default balldontlieApiService;
