// src/store/slices/hybridDataSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import balldontlieApiService from '../../services/balldontlieApi';
import oddsApiService from '../../services/oddsApi';

// Define types
interface Team {
  id: number;
  name: string;
  fullName: string;
  city: string;
  score: number;
}

interface Odds {
  moneyline: {
    home: number | null;
    away: number | null;
    updated: string | null;
  };
  spread: {
    home: number | null;
    away: number | null;
    homePoint: number | null;
    awayPoint: number | null;
    updated: string | null;
  };
  total: {
    over: number | null;
    under: number | null;
    point: number | null;
    updated: string | null;
  };
}

interface Game {
  id: string;
  date: string;
  status: string;
  period: number;
  time: string;
  homeTeam: Team;
  awayTeam: Team;
  odds: Odds;
}

interface PlayerStat {
  id: string;
  player: {
    id: number;
    firstName: string;
    lastName: string;
    position: string;
    teamId: number;
    teamName: string;
  };
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    minutes: string;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    fieldGoalPercentage: number;
    threePointersMade: number;
    threePointersAttempted: number;
    threePointerPercentage: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    freeThrowPercentage: number;
  };
}

interface HybridDataState {
  games: Game[];
  selectedGame: Game | null;
  playerStats: PlayerStat[];
  teams: any[];
  loading: {
    games: boolean;
    game: boolean;
    stats: boolean;
    teams: boolean;
    odds: boolean;
  };
  error: {
    games: string | null;
    game: string | null;
    stats: string | null;
    teams: string | null;
    odds: string | null;
  };
}

// Initial state
const initialState: HybridDataState = {
  games: [],
  selectedGame: null,
  playerStats: [],
  teams: [],
  loading: {
    games: false,
    game: false,
    stats: false,
    teams: false,
    odds: false
  },
  error: {
    games: null,
    game: null,
    stats: null,
    teams: null,
    odds: null
  }
};

// Helper function to map balldontlie games to our enhanced format
const mapGamesToEnhancedGames = (games: any[]): Game[] => {
  return games.map(game => ({
    id: game.id.toString(),
    date: game.date,
    status: game.status,
    period: game.period,
    time: game.time,
    homeTeam: {
      id: game.home_team.id,
      name: game.home_team.name,
      fullName: game.home_team.full_name,
      city: game.home_team.city,
      score: game.home_team_score
    },
    awayTeam: {
      id: game.visitor_team.id,
      name: game.visitor_team.name,
      fullName: game.visitor_team.full_name,
      city: game.visitor_team.city,
      score: game.visitor_team_score
    },
    odds: {
      moneyline: {
        home: null,
        away: null,
        updated: null
      },
      spread: {
        home: null,
        away: null,
        homePoint: null,
        awayPoint: null,
        updated: null
      },
      total: {
        over: null,
        under: null,
        point: null,
        updated: null
      }
    }
  }));
};

// Helper function to enhance games with odds data
const enhanceGamesWithOdds = (games: Game[], oddsData: any[]): Game[] => {
  return games.map(game => {
    // Find matching odds game by team names
    const matchingOdds = oddsData.find(
      odds => 
        (odds.home_team.includes(game.homeTeam.name) || game.homeTeam.name.includes(odds.home_team)) &&
        (odds.away_team.includes(game.awayTeam.name) || game.awayTeam.name.includes(odds.away_team))
    );

    if (!matchingOdds) return game;

    // Get the first bookmaker
    const bookmaker = matchingOdds.bookmakers[0];
    if (!bookmaker) return game;

    // Extract odds data
    const moneylineMarket = bookmaker.markets.find(market => market.key === 'h2h');
    const spreadMarket = bookmaker.markets.find(market => market.key === 'spreads');
    const totalMarket = bookmaker.markets.find(market => market.key === 'totals');

    // Enhanced game with odds
    return {
      ...game,
      odds: {
        moneyline: {
          home: moneylineMarket?.outcomes.find(outcome => outcome.name.includes(game.homeTeam.name))?.price || null,
          away: moneylineMarket?.outcomes.find(outcome => outcome.name.includes(game.awayTeam.name))?.price || null,
          updated: moneylineMarket?.last_update || null
        },
        spread: {
          home: spreadMarket?.outcomes.find(outcome => outcome.name.includes(game.homeTeam.name))?.price || null,
          away: spreadMarket?.outcomes.find(outcome => outcome.name.includes(game.awayTeam.name))?.price || null,
          homePoint: spreadMarket?.outcomes.find(outcome => outcome.name.includes(game.homeTeam.name))?.point || null,
          awayPoint: spreadMarket?.outcomes.find(outcome => outcome.name.includes(game.awayTeam.name))?.point || null,
          updated: spreadMarket?.last_update || null
        },
        total: {
          over: totalMarket?.outcomes.find(outcome => outcome.name === 'Over')?.price || null,
          under: totalMarket?.outcomes.find(outcome => outcome.name === 'Under')?.price || null,
          point: totalMarket?.outcomes.find(outcome => outcome.name === 'Over')?.point || null,
          updated: totalMarket?.last_update || null
        }
      }
    };
  });
};

// Helper function to map player stats
const mapPlayerStats = (stats: any[]): PlayerStat[] => {
  return stats.map(stat => ({
    id: `${stat.player.id}-${stat.game.id}`,
    player: {
      id: stat.player.id,
      firstName: stat.player.first_name,
      lastName: stat.player.last_name,
      position: stat.player.position || 'N/A',
      teamId: stat.team.id,
      teamName: stat.team.name
    },
    stats: {
      points: stat.pts || 0,
      rebounds: (stat.dreb || 0) + (stat.oreb || 0),
      assists: stat.ast || 0,
      steals: stat.stl || 0,
      blocks: stat.blk || 0,
      turnovers: stat.turnover || 0,
      minutes: stat.min || '0',
      fieldGoalsMade: stat.fgm || 0,
      fieldGoalsAttempted: stat.fga || 0,
      fieldGoalPercentage: stat.fga > 0 ? stat.fgm / stat.fga : 0,
      threePointersMade: stat.fg3m || 0,
      threePointersAttempted: stat.fg3a || 0,
      threePointerPercentage: stat.fg3a > 0 ? stat.fg3m / stat.fg3a : 0,
      freeThrowsMade: stat.ftm || 0,
      freeThrowsAttempted: stat.fta || 0,
      freeThrowPercentage: stat.fta > 0 ? stat.ftm / stat.fta : 0
    }
  }));
};

// Async thunks
export const fetchGamesByDate = createAsyncThunk(
  'hybridData/fetchGamesByDate',
  async (date: Date, { rejectWithValue }) => {
    try {
      // Fetch games from balldontlie
      const gamesResponse = await balldontlieApiService.getGamesByDate(date);
      const enhancedGames = mapGamesToEnhancedGames(gamesResponse.data.data);
      
      // Fetch odds from The Odds API
      try {
        const oddsResponse = await oddsApiService.getNbaOdds();
        return enhanceGamesWithOdds(enhancedGames, oddsResponse);
      } catch (oddsError) {
        console.error('Error fetching odds:', oddsError);
        // Return games without odds if odds API fails
        return enhancedGames;
      }
    } catch (error) {
      return rejectWithValue('Failed to fetch games');
    }
  }
);

export const fetchGameById = createAsyncThunk(
  'hybridData/fetchGameById',
  async (gameId: number, { rejectWithValue }) => {
    try {
      // Fetch game from balldontlie
      const gameResponse = await balldontlieApiService.getGameById(gameId);
      const [enhancedGame] = mapGamesToEnhancedGames([gameResponse.data]);
      
      // Fetch odds from The Odds API
      try {
        const oddsResponse = await oddsApiService.getNbaOdds();
        const [gameWithOdds] = enhanceGamesWithOdds([enhancedGame], oddsResponse);
        return gameWithOdds;
      } catch (oddsError) {
        console.error('Error fetching odds:', oddsError);
        // Return game without odds if odds API fails
        return enhancedGame;
      }
    } catch (error) {
      return rejectWithValue('Failed to fetch game details');
    }
  }
);

export const fetchStatsByGame = createAsyncThunk(
  'hybridData/fetchStatsByGame',
  async (gameId: number, { rejectWithValue }) => {
    try {
      const response = await balldontlieApiService.getStatsByGame(gameId);
      return mapPlayerStats(response.data.data);
    } catch (error) {
      return rejectWithValue('Failed to fetch player statistics');
    }
  }
);

export const fetchTeams = createAsyncThunk(
  'hybridData/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await balldontlieApiService.getTeams();
      return response.data.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch teams');
    }
  }
);

// Create slice
const hybridDataSlice = createSlice({
  name: 'hybridData',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch games by date
    builder.addCase(fetchGamesByDate.pending, (state) => {
      state.loading.games = true;
      state.error.games = null;
    });
    builder.addCase(fetchGamesByDate.fulfilled, (state, action: PayloadAction<Game[]>) => {
      state.loading.games = false;
      state.games = action.payload;
    });
    builder.addCase(fetchGamesByDate.rejected, (state, action) => {
      state.loading.games = false;
      state.error.games = action.payload as string;
    });

    // Fetch game by ID
    builder.addCase(fetchGameById.pending, (state) => {
      state.loading.game = true;
      state.error.game = null;
    });
    builder.addCase(fetchGameById.fulfilled, (state, action: PayloadAction<Game>) => {
      state.loading.game = false;
      state.selectedGame = action.payload;
    });
    builder.addCase(fetchGameById.rejected, (state, action) => {
      state.loading.game = false;
      state.error.game = action.payload as string;
    });

    // Fetch stats by game
    builder.addCase(fetchStatsByGame.pending, (state) => {
      state.loading.stats = true;
      state.error.stats = null;
    });
    builder.addCase(fetchStatsByGame.fulfilled, (state, action: PayloadAction<PlayerStat[]>) => {
      state.loading.stats = false;
      state.playerStats = action.payload;
    });
    builder.addCase(fetchStatsByGame.rejected, (state, action) => {
      state.loading.stats = false;
      state.error.stats = action.payload as string;
    });

    // Fetch teams
    builder.addCase(fetchTeams.pending, (state) => {
      state.loading.teams = true;
      state.error.teams = null;
    });
    builder.addCase(fetchTeams.fulfilled, (state, action: PayloadAction<any[]>) => {
      state.loading.teams = false;
      state.teams = action.payload;
    });
    builder.addCase(fetchTeams.rejected, (state, action) => {
      state.loading.teams = false;
      state.error.teams = action.payload as string;
    });
  }
});

export default hybridDataSlice.reducer;
