// src/pages/HybridSchedulePage.tsx - Updated schedule page using hybrid API data

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchTeams } from '../store/slices/hybridDataSlice';
import HybridGameSchedule from '../components/schedule/HybridGameSchedule';

const HybridSchedulePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Fetch teams data on component mount
  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-6">NBA Schedule</h1>
      <div className="mb-6 bg-betting-card p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-2">Free NBA Data Integration</h2>
        <p className="text-gray-300">
          This page uses a hybrid approach with free API services:
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-300">
          <li>Game data from balldontlie API (free, no API key required)</li>
          <li>Betting odds from The Odds API (free tier with 500 requests/month)</li>
        </ul>
      </div>
      <HybridGameSchedule />
    </div>
  );
};

export default HybridSchedulePage;
