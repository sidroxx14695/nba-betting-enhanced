import React from 'react';

interface GameScoreTimelineProps {
  gameId: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
  scoreTimeline: any[];
  isLive: boolean;
}

const GameScoreTimeline: React.FC<GameScoreTimelineProps> = ({ gameId, homeTeam, awayTeam, scoreTimeline, isLive }) => {
  return (
    <div>
      <h3>Game Score Timeline</h3>
      <p>Game ID: {gameId}</p>
      <p>Home Team: {homeTeam.name}</p>
      <p>Away Team: {awayTeam.name}</p>
      <p>Live Status: {isLive ? 'Live' : 'Not Live'}</p>
      <ul>
        {scoreTimeline.map((point, index) => (
          <li key={index}>
            Period: {point.period}, Time: {point.time}, Home Score: {point.homeScore}, Away Score: {point.awayScore}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameScoreTimeline;