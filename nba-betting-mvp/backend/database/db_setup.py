import sqlite3
import os
from pathlib import Path

# Create data directory if it doesn't exist
data_dir = Path(__file__).parent.parent.parent / 'data'
data_dir.mkdir(exist_ok=True)

# Database path
DB_PATH = data_dir / 'nba_betting.db'

def create_tables():
    """Create the necessary tables for the NBA betting MVP"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Create teams table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        abbreviation TEXT NOT NULL,
        conference TEXT NOT NULL,
        division TEXT NOT NULL,
        logo_url TEXT
    )
    ''')
    
    # Create players table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        team_id INTEGER,
        position TEXT,
        jersey_number INTEGER,
        height TEXT,
        weight TEXT,
        FOREIGN KEY (team_id) REFERENCES teams (id)
    )
    ''')
    
    # Create games table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY,
        home_team_id INTEGER NOT NULL,
        away_team_id INTEGER NOT NULL,
        game_date TEXT NOT NULL,
        status TEXT NOT NULL,
        home_score INTEGER,
        away_score INTEGER,
        quarter INTEGER,
        time_remaining TEXT,
        FOREIGN KEY (home_team_id) REFERENCES teams (id),
        FOREIGN KEY (away_team_id) REFERENCES teams (id)
    )
    ''')
    
    # Create game_stats table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS game_stats (
        id INTEGER PRIMARY KEY,
        game_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        points INTEGER DEFAULT 0,
        rebounds INTEGER DEFAULT 0,
        assists INTEGER DEFAULT 0,
        steals INTEGER DEFAULT 0,
        blocks INTEGER DEFAULT 0,
        turnovers INTEGER DEFAULT 0,
        three_pointers_made INTEGER DEFAULT 0,
        three_pointers_attempted INTEGER DEFAULT 0,
        field_goals_made INTEGER DEFAULT 0,
        field_goals_attempted INTEGER DEFAULT 0,
        free_throws_made INTEGER DEFAULT 0,
        free_throws_attempted INTEGER DEFAULT 0,
        minutes_played TEXT,
        FOREIGN KEY (game_id) REFERENCES games (id),
        FOREIGN KEY (team_id) REFERENCES teams (id),
        FOREIGN KEY (player_id) REFERENCES players (id)
    )
    ''')
    
    # Create betting_odds table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS betting_odds (
        id INTEGER PRIMARY KEY,
        game_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        home_moneyline INTEGER,
        away_moneyline INTEGER,
        spread REAL,
        home_spread_odds INTEGER,
        away_spread_odds INTEGER,
        over_under REAL,
        over_odds INTEGER,
        under_odds INTEGER,
        FOREIGN KEY (game_id) REFERENCES games (id)
    )
    ''')
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        risk_profile TEXT DEFAULT 'moderate'
    )
    ''')
    
    # Create bets table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bets (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        bet_type TEXT NOT NULL,
        bet_amount REAL NOT NULL,
        odds INTEGER NOT NULL,
        potential_payout REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (game_id) REFERENCES games (id)
    )
    ''')
    
    # Create parlays table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS parlays (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        bet_amount REAL NOT NULL,
        total_odds INTEGER NOT NULL,
        potential_payout REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create parlay_bets table to link bets to parlays
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS parlay_bets (
        id INTEGER PRIMARY KEY,
        parlay_id INTEGER NOT NULL,
        bet_id INTEGER NOT NULL,
        FOREIGN KEY (parlay_id) REFERENCES parlays (id),
        FOREIGN KEY (bet_id) REFERENCES bets (id)
    )
    ''')
    
    # Create predictions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY,
        game_id INTEGER NOT NULL,
        prediction_type TEXT NOT NULL,
        prediction_value REAL NOT NULL,
        confidence REAL NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    
    print(f"Database created at {DB_PATH}")
    return str(DB_PATH)

if __name__ == "__main__":
    create_tables()
