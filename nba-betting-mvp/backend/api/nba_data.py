import requests
import json
import os
import time
from datetime import datetime, timedelta
import sqlite3
from pathlib import Path

# Database path
data_dir = Path(__file__).parent.parent.parent / 'data'
DB_PATH = data_dir / 'nba_betting.db'

# API configuration
# Note: In a production environment, these would be stored in environment variables
API_BASE_URL = "https://api.sportsdata.io/v3/nba"
API_KEY = "YOUR_API_KEY_HERE"  # This is a placeholder, would need a real API key in production

# For demo purposes, we'll use cached data to avoid API rate limits and costs
CACHE_DIR = data_dir / 'cache'
CACHE_DIR.mkdir(exist_ok=True)

class NBADataService:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.api_key = API_KEY
        self.headers = {
            "Ocp-Apim-Subscription-Key": self.api_key
        }
    
    def _get_from_cache_or_api(self, endpoint, params=None, cache_file=None, force_refresh=False):
        """Get data from cache if available, otherwise from API"""
        if cache_file and not force_refresh:
            cache_path = CACHE_DIR / cache_file
            if cache_path.exists():
                with open(cache_path, 'r') as f:
                    data = json.load(f)
                    print(f"Loaded data from cache: {cache_file}")
                    return data
        
        # For demo purposes, we'll use sample data instead of making actual API calls
        # In a production environment, this would make a real API call
        if "teams" in endpoint:
            data = self._get_sample_teams()
        elif "games" in endpoint:
            data = self._get_sample_games()
        elif "players" in endpoint:
            data = self._get_sample_players()
        elif "odds" in endpoint:
            data = self._get_sample_odds()
        else:
            data = {"error": "Endpoint not supported in demo mode"}
        
        # Cache the data
        if cache_file:
            cache_path = CACHE_DIR / cache_file
            with open(cache_path, 'w') as f:
                json.dump(data, f)
                print(f"Cached data to: {cache_file}")
        
        return data
    
    def get_teams(self, force_refresh=False):
        """Get all NBA teams"""
        return self._get_from_cache_or_api(
            endpoint="teams",
            cache_file="teams.json",
            force_refresh=force_refresh
        )
    
    def get_players(self, force_refresh=False):
        """Get all NBA players"""
        return self._get_from_cache_or_api(
            endpoint="players",
            cache_file="players.json",
            force_refresh=force_refresh
        )
    
    def get_games(self, start_date=None, end_date=None, force_refresh=False):
        """Get NBA games for a date range"""
        if not start_date:
            start_date = datetime.now().strftime("%Y-%m-%d")
        if not end_date:
            end_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        cache_file = f"games_{start_date}_to_{end_date}.json"
        return self._get_from_cache_or_api(
            endpoint=f"games/{start_date}/{end_date}",
            cache_file=cache_file,
            force_refresh=force_refresh
        )
    
    def get_game_odds(self, game_id=None, force_refresh=False):
        """Get betting odds for games"""
        cache_file = "game_odds.json"
        if game_id:
            cache_file = f"game_odds_{game_id}.json"
        
        return self._get_from_cache_or_api(
            endpoint="odds",
            cache_file=cache_file,
            force_refresh=force_refresh
        )
    
    def _get_sample_teams(self):
        """Return sample NBA teams data for demo purposes"""
        return [
            {"TeamID": 1, "Key": "ATL", "City": "Atlanta", "Name": "Hawks", "Conference": "Eastern", "Division": "Southeast"},
            {"TeamID": 2, "Key": "BOS", "City": "Boston", "Name": "Celtics", "Conference": "Eastern", "Division": "Atlantic"},
            {"TeamID": 3, "Key": "BKN", "City": "Brooklyn", "Name": "Nets", "Conference": "Eastern", "Division": "Atlantic"},
            {"TeamID": 4, "Key": "CHA", "City": "Charlotte", "Name": "Hornets", "Conference": "Eastern", "Division": "Southeast"},
            {"TeamID": 5, "Key": "CHI", "City": "Chicago", "Name": "Bulls", "Conference": "Eastern", "Division": "Central"},
            {"TeamID": 6, "Key": "CLE", "City": "Cleveland", "Name": "Cavaliers", "Conference": "Eastern", "Division": "Central"},
            {"TeamID": 7, "Key": "DAL", "City": "Dallas", "Name": "Mavericks", "Conference": "Western", "Division": "Southwest"},
            {"TeamID": 8, "Key": "DEN", "City": "Denver", "Name": "Nuggets", "Conference": "Western", "Division": "Northwest"},
            {"TeamID": 9, "Key": "DET", "City": "Detroit", "Name": "Pistons", "Conference": "Eastern", "Division": "Central"},
            {"TeamID": 10, "Key": "GSW", "City": "Golden State", "Name": "Warriors", "Conference": "Western", "Division": "Pacific"}
        ]
    
    def _get_sample_players(self):
        """Return sample NBA players data for demo purposes"""
        return [
            {"PlayerID": 1, "TeamID": 2, "Name": "Jayson Tatum", "Position": "SF", "Jersey": 0, "Height": "6'8\"", "Weight": "210"},
            {"PlayerID": 2, "TeamID": 2, "Name": "Jaylen Brown", "Position": "SG", "Jersey": 7, "Height": "6'6\"", "Weight": "223"},
            {"PlayerID": 3, "TeamID": 7, "Name": "Luka Doncic", "Position": "PG", "Jersey": 77, "Height": "6'7\"", "Weight": "230"},
            {"PlayerID": 4, "TeamID": 8, "Name": "Nikola Jokic", "Position": "C", "Jersey": 15, "Height": "6'11\"", "Weight": "284"},
            {"PlayerID": 5, "TeamID": 10, "Name": "Stephen Curry", "Position": "PG", "Jersey": 30, "Height": "6'2\"", "Weight": "185"}
        ]
    
    def _get_sample_games(self):
        """Return sample NBA games data for demo purposes"""
        today = datetime.now()
        tomorrow = today + timedelta(days=1)
        day_after = today + timedelta(days=2)
        
        return [
            {
                "GameID": 1001,
                "Status": "Scheduled",
                "DateTime": today.strftime("%Y-%m-%dT%H:%M:%S"),
                "HomeTeam": "BOS",
                "AwayTeam": "GSW",
                "HomeTeamID": 2,
                "AwayTeamID": 10,
                "HomeTeamScore": None,
                "AwayTeamScore": None,
                "Quarter": None,
                "TimeRemainingMinutes": None,
                "TimeRemainingSeconds": None
            },
            {
                "GameID": 1002,
                "Status": "Scheduled",
                "DateTime": tomorrow.strftime("%Y-%m-%dT%H:%M:%S"),
                "HomeTeam": "DAL",
                "AwayTeam": "DEN",
                "HomeTeamID": 7,
                "AwayTeamID": 8,
                "HomeTeamScore": None,
                "AwayTeamScore": None,
                "Quarter": None,
                "TimeRemainingMinutes": None,
                "TimeRemainingSeconds": None
            },
            {
                "GameID": 1003,
                "Status": "Scheduled",
                "DateTime": day_after.strftime("%Y-%m-%dT%H:%M:%S"),
                "HomeTeam": "CHI",
                "AwayTeam": "CLE",
                "HomeTeamID": 5,
                "AwayTeamID": 6,
                "HomeTeamScore": None,
                "AwayTeamScore": None,
                "Quarter": None,
                "TimeRemainingMinutes": None,
                "TimeRemainingSeconds": None
            }
        ]
    
    def _get_sample_odds(self):
        """Return sample betting odds data for demo purposes"""
        return [
            {
                "GameID": 1001,
                "Timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "HomeMoneyLine": -150,
                "AwayMoneyLine": +130,
                "HomePointSpread": -3.5,
                "AwayPointSpread": 3.5,
                "HomePointSpreadPayout": -110,
                "AwayPointSpreadPayout": -110,
                "OverUnder": 220.5,
                "OverPayout": -110,
                "UnderPayout": -110
            },
            {
                "GameID": 1002,
                "Timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "HomeMoneyLine": +120,
                "AwayMoneyLine": -140,
                "HomePointSpread": 2.5,
                "AwayPointSpread": -2.5,
                "HomePointSpreadPayout": -110,
                "AwayPointSpreadPayout": -110,
                "OverUnder": 225.5,
                "OverPayout": -110,
                "UnderPayout": -110
            },
            {
                "GameID": 1003,
                "Timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "HomeMoneyLine": -105,
                "AwayMoneyLine": -115,
                "HomePointSpread": -1.0,
                "AwayPointSpread": 1.0,
                "HomePointSpreadPayout": -110,
                "AwayPointSpreadPayout": -110,
                "OverUnder": 215.0,
                "OverPayout": -110,
                "UnderPayout": -110
            }
        ]

    def sync_data_to_db(self):
        """Sync data from API/cache to database"""
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Sync teams
        teams = self.get_teams()
        for team in teams:
            cursor.execute('''
            INSERT OR REPLACE INTO teams (id, name, abbreviation, conference, division)
            VALUES (?, ?, ?, ?, ?)
            ''', (
                team["TeamID"],
                team["Name"],
                team["Key"],
                team["Conference"],
                team["Division"]
            ))
        
        # Sync players
        players = self.get_players()
        for player in players:
            cursor.execute('''
            INSERT OR REPLACE INTO players (id, name, team_id, position, jersey_number, height, weight)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                player["PlayerID"],
                player["Name"],
                player["TeamID"],
                player["Position"],
                player["Jersey"],
                player["Height"],
                player["Weight"]
            ))
        
        # Sync games
        games = self.get_games()
        for game in games:
            cursor.execute('''
            INSERT OR REPLACE INTO games (id, home_team_id, away_team_id, game_date, status, home_score, away_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                game["GameID"],
                game["HomeTeamID"],
                game["AwayTeamID"],
                game["DateTime"],
                game["Status"],
                game["HomeTeamScore"] if game["HomeTeamScore"] else 0,
                game["AwayTeamScore"] if game["AwayTeamScore"] else 0
            ))
        
        # Sync odds
        odds = self.get_game_odds()
        for odd in odds:
            cursor.execute('''
            INSERT OR REPLACE INTO betting_odds (game_id, timestamp, home_moneyline, away_moneyline, spread, 
                                               home_spread_odds, away_spread_odds, over_under, over_odds, under_odds)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                odd["GameID"],
                odd["Timestamp"],
                odd["HomeMoneyLine"],
                odd["AwayMoneyLine"],
                odd["HomePointSpread"],
                odd["HomePointSpreadPayout"],
                odd["AwayPointSpreadPayout"],
                odd["OverUnder"],
                odd["OverPayout"],
                odd["UnderPayout"]
            ))
        
        conn.commit()
        conn.close()
        print("Data synchronized to database successfully")
        return True

# For testing
if __name__ == "__main__":
    nba_service = NBADataService()
    nba_service.sync_data_to_db()
