// API service for making requests to the backend
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Games API
export const gamesApi = {
  getGames: async () => {
    try {
      const response = await api.get('/games');
      return response.data;
    } catch (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
  },
  
  getGameById: async (gameId: string) => {
    try {
      const response = await api.get(`/games/${gameId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      throw error;
    }
  }
};

// Risk Assessment API
export const riskAssessmentApi = {
  getQuestionnaire: async () => {
    try {
      const response = await api.get('/risk-assessment');
      return response.data;
    } catch (error) {
      console.error('Error fetching risk assessment questionnaire:', error);
      throw error;
    }
  },
  
  submitResponses: async (userId: string, responses: any[]) => {
    try {
      const response = await api.post('/risk-assessment/submit', { userId, responses });
      return response.data;
    } catch (error) {
      console.error('Error submitting risk assessment responses:', error);
      throw error;
    }
  }
};

export default api;
