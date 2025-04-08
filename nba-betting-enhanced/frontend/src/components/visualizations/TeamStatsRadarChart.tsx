import React from 'react';

interface TeamStatsRadarChartProps {
  gameId: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  homeTeamStats: any;
  awayTeamStats: any;
}

const TeamStatsRadarChart: React.FC<TeamStatsRadarChartProps> = ({
  gameId,
  homeTeam,
  awayTeam,
  homeTeamStats,
  awayTeamStats,
}) => {
  return (
    <div>
      <h3>Team Stats Radar Chart</h3>
      <p>Game ID: {gameId}</p>
      <p>Home Team: {homeTeam.name}</p>
      <p>Away Team: {awayTeam.name}</p>
      {/* Add radar chart visualization logic here */}
    </div>
  );
};

export default TeamStatsRadarChart;