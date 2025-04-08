import React, { useEffect, useState } from 'react';
import { gamesApi } from '../services/api';
import ParlayRecommendationCard from '../components/betting/ParlayRecommendationCard';
import GameCard from '../components/GameCard';
import ScorePredictionChart from '../components/visualizations/ScorePredictionChart';

const DashboardPage: React.FC = () => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any>({
    parlays: []
  });

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const gamesData = await gamesApi.getGames();
        setGames(gamesData);
        
        // Mock recommendation data for now
        setRecommendations({
          parlays: [
            {
              legs: [
                { 
                  id: '1',
                  gameId: 'game1',
                  homeTeam: 'Lakers',
                  awayTeam: 'Clippers',
                  betType: 'Moneyline',
                  selection: 'Lakers',
                  odds: -150,
                  confidence: 75
                },
                { 
                  id: '2',
                  gameId: 'game2',
                  homeTeam: 'Warriors',
                  awayTeam: 'Kings',
                  betType: 'Moneyline',
                  selection: 'Warriors',
                  odds: -200,
                  confidence: 80
                }
              ],
              combinedOdds: +264,
              winProbability: 0.48,
              confidence: 'Medium',
              recommendedStake: 25
            }
          ]
        });
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch active games');
        setLoading(false);
        console.error(err);
      }
    };

    fetchGames();
    
    // Set up polling for live updates if socket isn't available
    const intervalId = setInterval(() => {
      fetchGames();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading games data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-500 mb-2">{error}</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We're having trouble connecting to the server. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Games Section - Takes up 2/3 of the screen on large displays */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Live Games</h2>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          {games.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {games.map((game)  => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  homeTeam={game.homeTeam}
                  awayTeam={game.awayTeam}
                  status={game.status}
                  quarter={game.quarter}
                  timeRemaining={game.timeRemaining}
                  odds={game.odds}
                  predictions={game.predictions}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No active games at the moment</p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">Check back later for live games</p>
            </div>
          )}
          
          {/* Score Prediction Section for a Featured Game */}
          {games.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Score Predictions</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                  {games[0].homeTeam.city} {games[0].homeTeam.name} vs {games[0].awayTeam.city} {games[0].awayTeam.name}
                </h3>
                <ScorePredictionChart
                  gameId={games[0].id}
                  homeTeam={games[0].homeTeam.name}
                  awayTeam={games[0].awayTeam.name}
                  currentHomeScore={games[0].homeTeam.score}
                  currentAwayScore={games[0].awayTeam.score}
                  predictedHomeScore={games[0].predictions.predictedHomeScore || games[0].homeTeam.score * 2}
                  predictedAwayScore={games[0].predictions.predictedAwayScore || games[0].awayTeam.score * 2}
                  currentQuarter={games[0].quarter}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Recommendations Section - Takes up 1/3 of the screen on large displays */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Recommended Parlays</h2>
          
          {recommendations.parlays.length > 0 ? (
            <div className="space-y-4">
              {recommendations.parlays.map((parlay, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <ParlayRecommendationCard
                    parlayLegs={parlay.legs}
                    totalOdds={parlay.combinedOdds}
                    potentialWinnings={parlay.recommendedStake * (parlay.combinedOdds / 100)}
                    riskLevel={getRiskLevel(parlay.confidence)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">No recommendations available</p>
            </div>
          )}
          
          {/* User Stats Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Your Stats</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Win Rate</p>
                  <p className="text-2xl font-bold text-green-500">62%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">ROI</p>
                  <p className="text-2xl font-bold text-green-500">+18.5%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Bets Placed</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">24</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Avg. Odds</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">+142</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a href="/risk-assessment" className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm flex justify-center items-center">
                  View detailed betting history
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) ;
};

// Helper function to convert confidence string to risk level
const getRiskLevel = (confidence: string): 'low' | 'medium' | 'high' => {
  switch (confidence.toLowerCase()) {
    case 'high':
      return 'low';
    case 'medium':
      return 'medium';
    case 'low':
      return 'high';
    default:
      return 'medium';
  }
};

export default DashboardPage;
