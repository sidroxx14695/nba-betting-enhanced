// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import gamesReducer from './slices/gamesSlice';
import hybridDataReducer from './slices/hybridDataSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    games: gamesReducer,
    hybridData: hybridDataReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
