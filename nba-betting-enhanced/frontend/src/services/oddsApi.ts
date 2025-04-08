// src/services/oddsApi.ts
import axios from 'axios';

const BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.REACT_APP_ODDS_API_KEY || '';

const oddsApiService = {
  // Get all available sports
  getSports: async ()  => {
    const response = await axios.get(`${BASE_URL}/sports`, {
      params: {
        apiKey: API_KEY
      }
    });
    return response.data;
  },

  // Get NBA odds
  getNbaOdds: async () => {
    const response = await axios.get(`${BASE_URL}/sports/basketball_nba/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american'
      }
    });
    return response.data;
  },

  // Get odds for a specific game
  getGameOdds: async (gameId: string) => {
    const response = await axios.get(`${BASE_URL}/sports/basketball_nba/events/${gameId}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american'
      }
    });
    return response.data;
  }
};

export default oddsApiService;
