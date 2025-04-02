import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RiskProfile {
  appetite: number;
  category: string;
  volatilityTolerance: number;
  lastUpdated: string;
}

interface Budget {
  amount: number;
  period: string;
  maxBetPercentage: number;
  lossLimit: number;
  currency: string;
}

interface Preferences {
  betTypes: string[];
  minOdds: number;
  maxOdds: number;
  maxParlayLegs: number;
}

interface UserProfile {
  userId: string;
  riskProfile: RiskProfile;
  budget: Budget;
  preferences: Preferences;
}

interface Recommendation {
  type: string;
  gameId: string;
  team?: string;
  teamName?: string;
  odds: number;
  winProbability?: number;
  confidence: number;
  recommendedStake: number;
}

interface ParlayRecommendation {
  legs: Recommendation[];
  combinedOdds: number;
  winProbability: number;
  confidence: number;
  recommendedStake: number;
}

interface UserState {
  profile: UserProfile | null;
  recommendations: {
    singleBets: Recommendation[];
    parlays: ParlayRecommendation[];
  };
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  recommendations: {
    singleBets: [],
    parlays: []
  },
  loading: false,
  error: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.loading = false;
    },
    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateRecommendations: (state, action: PayloadAction<{
      singleBets: Recommendation[];
      parlays: ParlayRecommendation[];
    }>) => {
      state.recommendations = action.payload;
    }
  }
});

export const {
  fetchProfileStart,
  fetchProfileSuccess,
  fetchProfileFailure,
  updateRecommendations
} = userSlice.actions;

export default userSlice.reducer;
