import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Key } from 'readline';

interface Game {
  id: Key | null | undefined;
  gameId: string;
  homeTeam: {
    id: string;
    name: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
  };
  status: string;
  period: number;
  timeRemaining: number;
  predictions: {
    winProbability: {
      home: number;
      away: number;
      confidence: number;
    };
    spread: {
      value: number;
      confidence: number;
    };
    total: {
      value: number;
      confidence: number;
    };
  };
  odds: {
    pregame: {
      homeMoneyline: number;
      awayMoneyline: number;
      spread: number;
      total: number;
    };
    live: {
      homeMoneyline: number;
      awayMoneyline: number;
      spread: number;
      total: number;
    };
  };
}

interface GamesState {
  activeGames: Game[];
  selectedGame: Game | null;
  loading: boolean;
  error: string | null;
}

const initialState: GamesState = {
  activeGames: [],
  selectedGame: null,
  loading: false,
  error: null
};

const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
    fetchGamesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchGamesSuccess: (state, action: PayloadAction<Game[]>) => {
      state.activeGames = action.payload;
      state.loading = false;
    },
    fetchGamesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    selectGame: (state, action: PayloadAction<Game>) => {
      state.selectedGame = action.payload;
    },
    updateGameData: (state, action: PayloadAction<Game>) => {
      const index = state.activeGames.findIndex(
        game => game.gameId === action.payload.gameId
      );
      
      if (index !== -1) {
        state.activeGames[index] = action.payload;
      }
      
      if (state.selectedGame?.gameId === action.payload.gameId) {
        state.selectedGame = action.payload;
      }
    }
  }
});

export const {
  fetchGamesStart,
  fetchGamesSuccess,
  fetchGamesFailure,
  selectGame,
  updateGameData
} = gamesSlice.actions;

export default gamesSlice.reducer;
