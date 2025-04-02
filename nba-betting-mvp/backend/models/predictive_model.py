import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import sqlite3
import json
from pathlib import Path
import pickle
import os

# Database path
data_dir = Path(__file__).parent.parent.parent / 'data'
DB_PATH = data_dir / 'nba_betting.db'

# Models directory
MODELS_DIR = Path(__file__).parent.parent.parent / 'models'
MODELS_DIR.mkdir(exist_ok=True)

class PredictiveModel:
    def __init__(self):
        self.conn = sqlite3.connect(str(DB_PATH))
        self.scaler = StandardScaler()
        self.spread_model = None
        self.total_points_model = None
        self.moneyline_model = None
    
    def _get_training_data(self):
        """
        For a real implementation, this would pull historical game data
        For our MVP, we'll create synthetic training data
        """
        # In a real implementation, this would query historical data from the database
        # For the MVP, we'll generate synthetic data
        np.random.seed(42)  # For reproducibility
        
        # Generate 1000 synthetic games
        n_samples = 1000
        
        # Features that might predict game outcomes
        home_team_win_pct = np.random.uniform(0.2, 0.8, n_samples)
        away_team_win_pct = np.random.uniform(0.2, 0.8, n_samples)
        home_team_points_per_game = np.random.uniform(95, 120, n_samples)
        away_team_points_per_game = np.random.uniform(95, 120, n_samples)
        home_team_points_allowed = np.random.uniform(95, 120, n_samples)
        away_team_points_allowed = np.random.uniform(95, 120, n_samples)
        home_court_advantage = np.random.uniform(1, 5, n_samples)
        days_rest_home = np.random.randint(1, 5, n_samples)
        days_rest_away = np.random.randint(1, 5, n_samples)
        
        # Create feature matrix
        X = np.column_stack([
            home_team_win_pct, away_team_win_pct,
            home_team_points_per_game, away_team_points_per_game,
            home_team_points_allowed, away_team_points_allowed,
            home_court_advantage, days_rest_home, days_rest_away
        ])
        
        # Generate target variables with some realistic relationships to features
        # Home team points (influenced by their offense, away team defense, rest, etc.)
        home_points = (
            home_team_points_per_game * 0.6 + 
            (120 - away_team_points_allowed) * 0.3 + 
            home_court_advantage * 2 + 
            days_rest_home * 0.5 +
            np.random.normal(0, 5, n_samples)  # Random noise
        )
        
        # Away team points
        away_points = (
            away_team_points_per_game * 0.6 + 
            (120 - home_team_points_allowed) * 0.3 - 
            home_court_advantage * 0.5 + 
            days_rest_away * 0.5 +
            np.random.normal(0, 5, n_samples)  # Random noise
        )
        
        # Calculate derived targets
        total_points = home_points + away_points
        point_diff = home_points - away_points
        home_win = (point_diff > 0).astype(int)
        
        # Create a DataFrame for easier handling
        df = pd.DataFrame({
            'home_team_win_pct': home_team_win_pct,
            'away_team_win_pct': away_team_win_pct,
            'home_team_ppg': home_team_points_per_game,
            'away_team_ppg': away_team_points_per_game,
            'home_team_points_allowed': home_team_points_allowed,
            'away_team_points_allowed': away_team_points_allowed,
            'home_court_advantage': home_court_advantage,
            'days_rest_home': days_rest_home,
            'days_rest_away': days_rest_away,
            'home_points': home_points,
            'away_points': away_points,
            'total_points': total_points,
            'point_diff': point_diff,
            'home_win': home_win
        })
        
        return df
    
    def train_models(self):
        """Train predictive models for different betting markets"""
        df = self._get_training_data()
        
        # Features for training
        features = [
            'home_team_win_pct', 'away_team_win_pct',
            'home_team_ppg', 'away_team_ppg',
            'home_team_points_allowed', 'away_team_points_allowed',
            'home_court_advantage', 'days_rest_home', 'days_rest_away'
        ]
        
        X = df[features].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train point spread model (regression)
        y_spread = df['point_diff'].values
        self.spread_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.spread_model.fit(X_scaled, y_spread)
        
        # Train total points model (regression)
        y_total = df['total_points'].values
        self.total_points_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.total_points_model.fit(X_scaled, y_total)
        
        # Train moneyline model (classification)
        y_moneyline = df['home_win'].values
        self.moneyline_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.moneyline_model.fit(X_scaled, y_moneyline)
        
        # Save models
        self._save_models()
        
        print("Models trained successfully")
        return True
    
    def _save_models(self):
        """Save trained models to disk"""
        # Save scaler
        with open(MODELS_DIR / 'scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save spread model
        with open(MODELS_DIR / 'spread_model.pkl', 'wb') as f:
            pickle.dump(self.spread_model, f)
        
        # Save total points model
        with open(MODELS_DIR / 'total_points_model.pkl', 'wb') as f:
            pickle.dump(self.total_points_model, f)
        
        # Save moneyline model
        with open(MODELS_DIR / 'moneyline_model.pkl', 'wb') as f:
            pickle.dump(self.moneyline_model, f)
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            # Load scaler
            with open(MODELS_DIR / 'scaler.pkl', 'rb') as f:
                self.scaler = pickle.load(f)
            
            # Load spread model
            with open(MODELS_DIR / 'spread_model.pkl', 'rb') as f:
                self.spread_model = pickle.load(f)
            
            # Load total points model
            with open(MODELS_DIR / 'total_points_model.pkl', 'rb') as f:
                self.total_points_model = pickle.load(f)
            
            # Load moneyline model
            with open(MODELS_DIR / 'moneyline_model.pkl', 'rb') as f:
                self.moneyline_model = pickle.load(f)
            
            return True
        except FileNotFoundError:
            print("Models not found. Please train models first.")
            return False
    
    def predict_game(self, game_features):
        """
        Make predictions for a game
        
        Args:
            game_features: Dictionary with game features
                {
                    'home_team_win_pct': float,
                    'away_team_win_pct': float,
                    'home_team_ppg': float,
                    'away_team_ppg': float,
                    'home_team_points_allowed': float,
                    'away_team_points_allowed': float,
                    'home_court_advantage': float,
                    'days_rest_home': int,
                    'days_rest_away': int
                }
        
        Returns:
            Dictionary with predictions and confidence scores
        """
        # Ensure models are loaded
        if not self.spread_model or not self.total_points_model or not self.moneyline_model:
            if not self.load_models():
                self.train_models()
        
        # Extract features in the correct order
        features = [
            game_features['home_team_win_pct'],
            game_features['away_team_win_pct'],
            game_features['home_team_ppg'],
            game_features['away_team_ppg'],
            game_features['home_team_points_allowed'],
            game_features['away_team_points_allowed'],
            game_features['home_court_advantage'],
            game_features['days_rest_home'],
            game_features['days_rest_away']
        ]
        
        # Scale features
        X = np.array(features).reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        spread_pred = self.spread_model.predict(X_scaled)[0]
        total_points_pred = self.total_points_model.predict(X_scaled)[0]
        moneyline_prob = self.moneyline_model.predict_proba(X_scaled)[0][1]  # Probability of home team win
        
        # Calculate confidence scores (simplified for MVP)
        # In a real implementation, these would be more sophisticated
        spread_confidence = min(0.9, max(0.5, 0.7 + abs(spread_pred) / 20))
        total_confidence = 0.7  # Fixed for MVP
        moneyline_confidence = min(0.9, max(0.5, abs(moneyline_prob - 0.5) * 2))
        
        # Return predictions with confidence
        return {
            'spread': {
                'prediction': spread_pred,
                'confidence': spread_confidence
            },
            'total': {
                'prediction': total_points_pred,
                'confidence': total_confidence
            },
            'moneyline': {
                'prediction': moneyline_prob,
                'confidence': moneyline_confidence
            }
        }
    
    def generate_game_predictions(self):
        """Generate predictions for upcoming games in the database"""
        # Connect to database
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Get upcoming games
        cursor.execute('''
        SELECT g.id, ht.id, at.id, g.game_date
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        WHERE g.status = 'Scheduled'
        ''')
        
        upcoming_games = cursor.fetchall()
        
        # For each game, generate predictions
        for game in upcoming_games:
            game_id, home_team_id, away_team_id, game_date = game
            
            # In a real implementation, we would fetch actual team stats
            # For MVP, we'll use synthetic data
            game_features = {
                'home_team_win_pct': np.random.uniform(0.4, 0.7),
                'away_team_win_pct': np.random.uniform(0.4, 0.7),
                'home_team_ppg': np.random.uniform(105, 115),
                'away_team_ppg': np.random.uniform(105, 115),
                'home_team_points_allowed': np.random.uniform(105, 115),
                'away_team_points_allowed': np.random.uniform(105, 115),
                'home_court_advantage': 3.0,  # Standard home court advantage
                'days_rest_home': np.random.randint(1, 4),
                'days_rest_away': np.random.randint(1, 4)
            }
            
            # Generate predictions
            predictions = self.predict_game(game_features)
            
            # Store predictions in database
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
            
            # Store spread prediction
            cursor.execute('''
            INSERT INTO predictions (game_id, prediction_type, prediction_value, confidence, timestamp)
            VALUES (?, ?, ?, ?, ?)
            ''', (
                game_id,
                'spread',
                predictions['spread']['prediction'],
                predictions['spread']['confidence'],
                timestamp
            ))
            
            # Store total points prediction
            cursor.execute('''
            INSERT INTO predictions (game_id, prediction_type, prediction_value, confidence, timestamp)
            VALUES (?, ?, ?, ?, ?)
            ''', (
                game_id,
                'total',
                predictions['total']['prediction'],
                predictions['total']['confidence'],
                timestamp
            ))
            
            # Store moneyline prediction
            cursor.execute('''
            INSERT INTO predictions (game_id, prediction_type, prediction_value, confidence, timestamp)
            VALUES (?, ?, ?, ?, ?)
            ''', (
                game_id,
                'moneyline',
                predictions['moneyline']['prediction'],
                predictions['moneyline']['confidence'],
                timestamp
            ))
        
        conn.commit()
        conn.close()
        
        print(f"Generated predictions for {len(upcoming_games)} upcoming games")
        return len(upcoming_games)

# For testing
if __name__ == "__main__":
    model = PredictiveModel()
    model.train_models()
    model.generate_game_predictions()
