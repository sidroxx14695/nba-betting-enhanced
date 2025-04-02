# NBA Predictive Model Development

## Overview

This document outlines the development of our basic predictive model for NBA games, focusing specifically on game outcomes, point spreads, and parlay probabilities. Given our budget constraints and MVP focus, we'll implement a streamlined yet effective approach that balances accuracy with simplicity.

## Model Objectives

1. **Primary Predictions**:
   - Game winner (home/away)
   - Point spread (margin of victory/defeat)
   - Total points (over/under)
   - Key player performance metrics

2. **Parlay-Specific Outputs**:
   - Probability of each individual bet succeeding
   - Combined probability for parlay legs
   - Confidence ratings for suggested parlays

## Model Architecture

We'll implement a hybrid approach combining statistical methods with basic machine learning:

### 1. Statistical Foundation Model

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Team & Player  │────▶│  Statistical    │────▶│  Baseline       │
│  Statistics     │     │  Analysis       │     │  Predictions    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2. Machine Learning Enhancement

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Historical     │────▶│  ML Model       │────▶│  Prediction     │
│  Game Data      │     │  Training       │     │  Refinement     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 3. Parlay Probability Calculator

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Individual     │────▶│  Correlation    │────▶│  Combined       │
│  Predictions    │     │  Analysis       │     │  Probability    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Statistical Foundation Model

### Key Components

1. **Team Strength Indicators**:
   - Offensive and defensive ratings
   - Home/away performance differentials
   - Recent form (last 10 games)
   - Rest advantage/disadvantage

2. **Matchup Analysis**:
   - Historical head-to-head results
   - Pace adjustment
   - Stylistic matchup factors

3. **Situational Factors**:
   - Back-to-back games
   - Travel distance
   - Home stand/road trip length

### Implementation

```python
# Example implementation of statistical foundation model
import pandas as pd
import numpy as np

class NBAStatisticalModel:
    def __init__(self, team_stats_df, historical_games_df):
        self.team_stats = team_stats_df
        self.historical_games = historical_games_df
        
    def calculate_team_strength(self, team_id):
        """Calculate overall team strength based on offensive/defensive ratings"""
        team_data = self.team_stats[self.team_stats['team_id'] == team_id].iloc[0]
        
        # Simple team strength formula
        strength = (team_data['offensive_rating'] - 100) - (team_data['defensive_rating'] - 100)
        
        # Adjust for recent form
        recent_games = self.historical_games[
            (self.historical_games['home_team_id'] == team_id) | 
            (self.historical_games['away_team_id'] == team_id)
        ].sort_values('date', ascending=False).head(10)
        
        wins = len(recent_games[
            ((recent_games['home_team_id'] == team_id) & (recent_games['home_score'] > recent_games['away_score'])) |
            ((recent_games['away_team_id'] == team_id) & (recent_games['away_score'] > recent_games['home_score']))
        ])
        
        recent_form_adjustment = (wins / 10) * 2 - 1  # Range from -1 to +1
        
        return strength + (recent_form_adjustment * 2)  # Weight recent form
    
    def predict_game(self, home_team_id, away_team_id, game_date):
        """Predict game outcome using statistical model"""
        home_strength = self.calculate_team_strength(home_team_id)
        away_strength = self.calculate_team_strength(away_team_id)
        
        # Home court advantage (approximately 3 points in NBA)
        home_advantage = 3.0
        
        # Check for back-to-back games
        home_b2b = self._is_back_to_back(home_team_id, game_date)
        away_b2b = self._is_back_to_back(away_team_id, game_date)
        
        # Back-to-back penalty (approximately 2 points)
        home_b2b_penalty = 2.0 if home_b2b else 0
        away_b2b_penalty = 2.0 if away_b2b else 0
        
        # Calculate predicted point differential
        predicted_diff = (home_strength - away_strength) + home_advantage - home_b2b_penalty + away_b2b_penalty
        
        # Calculate win probability using logistic function
        win_probability = 1 / (1 + np.exp(-predicted_diff / 5))
        
        # Predict total points based on team pace and efficiency
        home_team_pace = self.team_stats[self.team_stats['team_id'] == home_team_id]['pace'].iloc[0]
        away_team_pace = self.team_stats[self.team_stats['team_id'] == away_team_id]['pace'].iloc[0]
        
        # Average pace for the game
        game_pace = (home_team_pace + away_team_pace) / 2
        
        # Offensive and defensive ratings
        home_off = self.team_stats[self.team_stats['team_id'] == home_team_id]['offensive_rating'].iloc[0]
        home_def = self.team_stats[self.team_stats['team_id'] == home_team_id]['defensive_rating'].iloc[0]
        away_off = self.team_stats[self.team_stats['team_id'] == away_team_id]['offensive_rating'].iloc[0]
        away_def = self.team_stats[self.team_stats['team_id'] == away_team_id]['defensive_rating'].iloc[0]
        
        # Predict points for each team
        predicted_home_points = game_pace * (home_off / 100) * (away_def / 100) / 100 * 100
        predicted_away_points = game_pace * (away_off / 100) * (home_def / 100) / 100 * 100
        
        # Adjust for back-to-back games
        predicted_home_points -= home_b2b_penalty
        predicted_away_points -= away_b2b_penalty
        
        predicted_total = predicted_home_points + predicted_away_points
        
        return {
            'predicted_winner': home_team_id if predicted_diff > 0 else away_team_id,
            'win_probability': win_probability if predicted_diff > 0 else 1 - win_probability,
            'predicted_spread': abs(predicted_diff),
            'predicted_home_points': predicted_home_points,
            'predicted_away_points': predicted_away_points,
            'predicted_total': predicted_total,
            'confidence': self._calculate_confidence(win_probability, home_team_id, away_team_id)
        }
    
    def _is_back_to_back(self, team_id, game_date):
        """Check if team is playing on back-to-back nights"""
        previous_day = pd.to_datetime(game_date) - pd.Timedelta(days=1)
        
        previous_games = self.historical_games[
            ((self.historical_games['home_team_id'] == team_id) | 
             (self.historical_games['away_team_id'] == team_id)) &
            (self.historical_games['date'] == previous_day)
        ]
        
        return len(previous_games) > 0
    
    def _calculate_confidence(self, win_probability, home_team_id, away_team_id):
        """Calculate confidence level in prediction"""
        # Base confidence on how far probability is from 50%
        probability_confidence = abs(win_probability - 0.5) * 2  # Scale to 0-1
        
        # Check consistency of team performance (lower variance = higher confidence)
        home_team_games = self.historical_games[
            (self.historical_games['home_team_id'] == home_team_id) | 
            (self.historical_games['away_team_id'] == home_team_id)
        ].tail(20)
        
        away_team_games = self.historical_games[
            (self.historical_games['home_team_id'] == away_team_id) | 
            (self.historical_games['away_team_id'] == away_team_id)
        ].tail(20)
        
        # Calculate point differentials
        home_diffs = []
        for _, game in home_team_games.iterrows():
            if game['home_team_id'] == home_team_id:
                home_diffs.append(game['home_score'] - game['away_score'])
            else:
                home_diffs.append(game['away_score'] - game['home_score'])
                
        away_diffs = []
        for _, game in away_team_games.iterrows():
            if game['home_team_id'] == away_team_id:
                away_diffs.append(game['home_score'] - game['away_score'])
            else:
                away_diffs.append(game['away_score'] - game['home_score'])
        
        # Lower standard deviation = higher consistency = higher confidence
        home_std = np.std(home_diffs) if home_diffs else 15  # Default if no data
        away_std = np.std(away_diffs) if away_diffs else 15  # Default if no data
        
        # Convert to confidence score (inverse relationship)
        consistency_confidence = 1 - min(1, ((home_std + away_std) / 2) / 20)
        
        # Combine factors (weighted average)
        overall_confidence = (probability_confidence * 0.7) + (consistency_confidence * 0.3)
        
        return overall_confidence
```

## Machine Learning Enhancement

For the MVP, we'll implement a simple machine learning model to refine our statistical predictions.

### Model Selection

For our MVP, we'll use a **Gradient Boosting Regressor** for the following reasons:
- Good performance with limited data
- Handles non-linear relationships well
- Relatively interpretable
- Efficient training and prediction

### Feature Engineering

We'll create the following features:

1. **Team-Level Features**:
   - Season-to-date offensive/defensive ratings
   - Recent form (rolling averages over last 5/10 games)
   - Home/away performance differentials
   - Rest days since last game
   - Injuries impact score

2. **Matchup Features**:
   - Historical head-to-head results
   - Pace differential
   - Strength of schedule
   - Vegas line (as a benchmark)

3. **Situational Features**:
   - Back-to-back indicator
   - Days rest differential
   - Home stand/road trip length
   - Distance traveled

### Implementation

```python
# Example implementation of ML enhancement
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

class NBAMachineLearningModel:
    def __init__(self, historical_games_df, team_stats_df):
        self.historical_games = historical_games_df
        self.team_stats = team_stats_df
        self.spread_model = None
        self.total_model = None
        
    def prepare_features(self):
        """Prepare features for model training"""
        features = []
        
        for _, game in self.historical_games.iterrows():
            home_id = game['home_team_id']
            away_id = game['away_team_id']
            
            # Skip games with missing data
            if home_id not in self.team_stats['team_id'].values or away_id not in self.team_stats['team_id'].values:
                continue
                
            home_stats = self.team_stats[self.team_stats['team_id'] == home_id].iloc[0]
            away_stats = self.team_stats[self.team_stats['team_id'] == away_id].iloc[0]
            
            # Create feature dictionary
            feature_dict = {
                # Team ratings
                'home_offensive_rating': home_stats['offensive_rating'],
                'home_defensive_rating': home_stats['defensive_rating'],
                'away_offensive_rating': away_stats['offensive_rating'],
                'away_defensive_rating': away_stats['defensive_rating'],
                
                # Pace
                'home_pace': home_stats['pace'],
                'away_pace': away_stats['pace'],
                'pace_diff': home_stats['pace'] - away_stats['pace'],
                
                # Efficiency
                'home_efg': home_stats['efg_percentage'],
                'away_efg': away_stats['efg_percentage'],
                
                # Records
                'home_win_pct': self._calculate_win_pct(home_id, game['date']),
                'away_win_pct': self._calculate_win_pct(away_id, game['date']),
                
                # Rest
                'home_rest_days': self._calculate_rest_days(home_id, game['date']),
                'away_rest_days': self._calculate_rest_days(away_id, game['date']),
                'rest_diff': self._calculate_rest_days(home_id, game['date']) - self._calculate_rest_days(away_id, game['date']),
                
                # Back-to-back
                'home_b2b': 1 if self._calculate_rest_days(home_id, game['date']) == 0 else 0,
                'away_b2b': 1 if self._calculate_rest_days(away_id, game['date']) == 0 else 0,
                
                # Vegas line (if available)
                'vegas_spread': game.get('spread', 0),
                'vegas_total': game.get('over_under', 0),
                
                # Target variables
                'actual_spread': game['home_score'] - game['away_score'],
                'actual_total': game['home_score'] + game['away_score']
            }
            
            features.append(feature_dict)
            
        return pd.DataFrame(features)
    
    def train_models(self):
        """Train ML models for spread and total predictions"""
        df = self.prepare_features()
        
        # Split features and targets
        X_spread = df.drop(['actual_spread', 'actual_total'], axis=1)
        y_spread = df['actual_spread']
        
        X_total = df.drop(['actual_spread', 'actual_total'], axis=1)
        y_total = df['actual_total']
        
        # Handle missing values
        X_spread = X_spread.fillna(0)
        X_total = X_total.fillna(0)
        
        # Create pipelines with preprocessing
        self.spread_model = Pipeline([
            ('scaler', StandardScaler()),
            ('model', GradientBoostingRegressor(n_estimators=100, max_depth=3))
        ])
        
        self.total_model = Pipeline([
            ('scaler', StandardScaler()),
            ('model', GradientBoostingRegressor(n_estimators=100, max_depth=3))
        ])
        
        # Train models
        self.spread_model.fit(X_spread, y_spread)
        self.total_model.fit(X_total, y_total)
        
        print("Models trained successfully")
        
    def predict_game(self, home_team_id, away_team_id, game_date):
        """Make predictions for a specific game"""
        # Get team stats
        home_stats = self.team_stats[self.team_stats['team_id'] == home_team_id].iloc[0]
        away_stats = self.team_stats[self.team_stats['team_id'] == away_team_id].iloc[0]
        
        # Create feature dictionary
        features = {
            # Team ratings
            'home_offensive_rating': home_stats['offensive_rating'],
            'home_defensive_rating': home_stats['defensive_rating'],
            'away_offensive_rating': away_stats['offensive_rating'],
            'away_defensive_rating': away_stats['defensive_rating'],
            
            # Pace
            'home_pace': home_stats['pace'],
            'away_pace': away_stats['pace'],
            'pace_diff': home_stats['pace'] - away_stats['pace'],
            
            # Efficiency
            'home_efg': home_stats['efg_percentage'],
            'away_efg': away_stats['efg_percentage'],
            
            # Records
            'home_win_pct': self._calculate_win_pct(home_team_id, game_date),
            'away_win_pct': self._calculate_win_pct(away_team_id, game_date),
            
            # Rest
            'home_rest_days': self._calculate_rest_days(home_team_id, game_date),
            'away_rest_days': self._calculate_rest_days(away_team_id, game_date),
            'rest_diff': self._calculate_rest_days(home_team_id, game_date) - self._calculate_rest_days(away_team_id, game_date),
            
            # Back-to-back
            'home_b2b': 1 if self._calculate_rest_days(home_team_id, game_date) == 0 else 0,
            'away_b2b': 1 if self._calculate_rest_days(away_team_id, game_date) == 0 else 0,
            
            # Vegas line (use 0 if not available)
            'vegas_spread': 0,
            'vegas_total': 0
        }
        
        # Convert to DataFrame
        X = pd.DataFrame([features])
        
        # Make predictions
        predicted_spread = self.spread_model.predict(X)[0]
        predicted_total = self.total_model.predict(X)[0]
        
        # Calculate win probability using logistic function
        win_probability = 1 / (1 + np.exp(-predicted_spread / 5))
        
        # Calculate individual team scores
        predicted_home_points = (predicted_total + predicted_spread) / 2
        predicted_away_points = (predicted_total - predicted_spread) / 2
        
        return {
            'predicted_winner': home_team_id if predicted_spread > 0 else away_team_id,
            'win_probability': win_probability if predicted_spread > 0 else 1 - win_probability,
            'predicted_spread': abs(predicted_spread),
            'predicted_home_points': predicted_home_points,
            'predicted_away_points': predicted_away_points,
            'predicted_total': predicted_total,
            'confidence': self._calculate_prediction_confidence(X)
        }
    
    def _calculate_win_pct(self, team_id, date):
        """Calculate team's win percentage up to the given date"""
        previous_games = self.historical_games[
            ((self.historical_games['home_team_id'] == team_id) | 
             (self.historical_games['away_team_id'] == team_id)) &
            (self.historical_games['date'] < date)
        ]
        
        if len(previous_games) == 0:
            return 0.5  # Default to 50% if no previous games
        
        wins = 0
        for _, game in previous_games.iterrows():
            if game['home_team_id'] == team_id and game['home_score'] > game['away_score']:
                wins += 1
            elif game['away_team_id'] == team_id and game['away_score'] > game['home_score']:
                wins += 1
                
        return wins / len(previous_games)
    
    def _calculate_rest_days(self, team_id, game_date):
        """Calculate days of rest for a team before the given game"""
        previous_games = self.historical_games[
            ((self.historical_games['home_team_id'] == team_id) | 
             (self.historical_games['away_team_id'] == team_id)) &
            (self.historical_games['date'] < game_date)
        ].sort_values('date', ascending=False)
        
        if len(previous_games) == 0:
            return 3  # Default to average rest if no previous games
        
        last_game_date = previous_games.iloc[0]['date']
        rest_days = (pd.to_datetime(game_date) - pd.to_datetime(last_game_date)).days
        
        return rest_days
    
    def _calculate_prediction_confidence(self, X):
        """Calculate confidence in the prediction"""
        # For MVP, use a simplified confidence metric
        # In a more advanced model, we could use prediction intervals
        return 0.7  # Default confidence level for MVP
```

## Parlay Probability Calculator

For parlays, we need to account for potential correlations between bets.

### Implementation

```python
class ParlayCalculator:
    def __init__(self, prediction_model):
        self.prediction_model = prediction_model
        
    def calculate_parlay_probability(self, bets):
        """Calculate the probability of a parlay hitting"""
        individual_probabilities = []
        
        for bet in bets:
            game_id = bet['game_id']
            bet_type = bet['bet_type']
            team_id = bet.get('team_id')
            line = bet.get('line')
            
            # Get game details
            game = self._get_game_by_id(game_id)
            if not game:
                continue
                
            # Get prediction for this game
            prediction = self.prediction_model.predict_game(
                game['home_team_id'], 
                game['away_team_id'], 
                game['date']
            )
            
            # Calculate probability based on bet type
            if bet_type == 'moneyline':
                if team_id == prediction['predicted_winner']:
                    prob = prediction['win_probability']
                else:
                    prob = 1 - prediction['win_probability']
                    
            elif bet_type == 'spread':
                # For spread bets, we need to adjust based on the line
                if team_id == game['home_team_id']:
                    adjusted_spread = prediction['predicted_spread'] + line
                    prob = self._spread_probability(adjusted_spread)
                else:
                    adjusted_spread = prediction['predicted_spread'] - line
                    prob = self._spread_probability(adjusted_spread)
                    
            elif bet_type == 'over':
                # For over bets
                prob = self._total_probability(prediction['predicted_total'], line, 'over')
                
            elif bet_type == 'under':
                # For under bets
                prob = self._total_probability(prediction['predicted_total'], line, 'under')
                
            else:
                # Default fallback
                prob = 0.5
                
            individual_probabilities.append({
                'bet': bet,
                'probability': prob,
                'confidence': prediction.get('confidence', 0.5)
            })
        
        # Calculate combined probability
        # For MVP, we'll use a simplified approach that assumes some correlation
        if not individual_probabilities:
            return 0
            
        # Start with independent probability calculation
        independent_probability = 1.0
        for bet_prob in individual_probabilities:
            independent_probability *= bet_prob['probability']
            
        # Apply a correlation adjustment (simplified for MVP)
        # In reality, correlation would be calculated based on historical data
        correlation_factor = 0.95  # Slight positive correlation assumption
        
        adjusted_probability = independent_probability ** correlation_factor
        
        # Calculate average confidence
        avg_confidence = sum(bet_prob['confidence'] for bet_prob in individual_probabilities) / len(individual_probabilities)
        
        return {
            'individual_probabilities': individual_probabilities,
            'independent_probability': independent_probability,
            'adjusted_probability': adjusted_probability,
            'confidence': avg_confidence
        }
    
    def suggest_parlays(self, upcoming_games, max_legs=3):
        """Suggest promising parlays based on model confidence"""
        all_bets = []
        
        # Generate potential bets for each game
        for game in upcoming_games:
            prediction = self.prediction_model.predict_game(
                game['home_team_id'], 
                game['away_team_id'], 
                game['date']
            )
            
            # Only include high confidence predictions
            if prediction['confidence'] >= 0.65:
                # Moneyline bet on predicted winner
                all_bets.append({
                    'game_id': game['_id'],
                    'bet_type': 'moneyline',
                    'team_id': prediction['predicted_winner'],
                    'confidence': prediction['confidence'],
                    'probability': prediction['win_probability'] if prediction['predicted_winner'] == game['home_team_id'] else 1 - prediction['win_probability']
                })
                
                # Spread bet if confidence is high
                if prediction['confidence'] >= 0.7:
                    all_bets.append({
                        'game_id': game['_id'],
                        'bet_type': 'spread',
                        'team_id': prediction['predicted_winner'],
                        'line': -prediction['predicted_spread'] if prediction['predicted_winner'] == game['home_team_id'] else prediction['predicted_spread'],
                        'confidence': prediction['confidence'] * 0.9,  # Slightly lower confidence for spread
                        'probability': 0.65  # Simplified for MVP
                    })
                
                # Total bet if confidence is high
                if prediction['confidence'] >= 0.7:
                    # Determine over/under based on model's historical accuracy
                    total_bet_type = 'over' if prediction['predicted_total'] > 220 else 'under'
                    all_bets.append({
                        'game_id': game['_id'],
                        'bet_type': total_bet_type,
                        'line': prediction['predicted_total'],
                        'confidence': prediction['confidence'] * 0.85,  # Lower confidence for totals
                        'probability': 0.6  # Simplified for MVP
                    })
        
        # Sort bets by confidence
        all_bets.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Generate parlays (simplified for MVP)
        suggested_parlays = []
        
        # Take top N bets and create combinations
        top_bets = all_bets[:min(10, len(all_bets))]
        
        # For MVP, we'll just create a few simple combinations
        # In a more advanced version, we would use combinatorial optimization
        
        # 2-leg parlays from top 5 bets
        if len(top_bets) >= 2:
            for i in range(min(5, len(top_bets))):
                for j in range(i+1, min(5, len(top_bets))):
                    # Skip if same game
                    if top_bets[i]['game_id'] == top_bets[j]['game_id']:
                        continue
                        
                    parlay = {
                        'legs': [top_bets[i], top_bets[j]],
                        'name': f"2-Leg High Confidence Parlay #{len(suggested_parlays)+1}"
                    }
                    
                    # Calculate probability
                    prob_result = self.calculate_parlay_probability(parlay['legs'])
                    parlay['probability'] = prob_result['adjusted_probability']
                    parlay['confidence'] = prob_result['confidence']
                    
                    suggested_parlays.append(parlay)
        
        # 3-leg parlays from top 6 bets
        if len(top_bets) >= 3:
            for i in range(min(6, len(top_bets))):
                for j in range(i+1, min(6, len(top_bets))):
                    for k in range(j+1, min(6, len(top_bets))):
                        # Skip if same game
                        if (top_bets[i]['game_id'] == top_bets[j]['game_id'] or 
                            top_bets[i]['game_id'] == top_bets[k]['game_id'] or 
                            top_bets[j]['game_id'] == top_bets[k]['game_id']):
                            continue
                            
                        parlay = {
                            'legs': [top_bets[i], top_bets[j], top_bets[k]],
                            'name': f"3-Leg High Confidence Parlay #{len(suggested_parlays)+1}"
                        }
                        
                        # Calculate probability
                        prob_result = self.calculate_parlay_probability(parlay['legs'])
                        parlay['probability'] = prob_result['adjusted_probability']
                        parlay['confidence'] = prob_result['confidence']
                        
                        suggested_parlays.append(parlay)
        
        # Sort by confidence
        suggested_parlays.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Return top parlays
        return suggested_parlays[:5]
    
    def _get_game_by_id(self, game_id):
        """Get game details by ID (placeholder - would be implemented with database)"""
        # In actual implementation, this would query the database
        # For this example, we'll return a placeholder
        return {
            '_id': game_id,
            'home_team_id': 'team1',
            'away_team_id': 'team2',
            'date': '2025-04-01'
        }
    
    def _spread_probability(self, adjusted_spread):
        """Calculate probability of covering the spread"""
        # Simplified calculation for MVP
        # In a more advanced model, this would use a distribution
        if adjusted_spread > 10:
            return 0.8
        elif adjusted_spread > 5:
            return 0.7
        elif adjusted_spread > 0:
            return 0.6
        elif adjusted_spread > -5:
            return 0.4
        elif adjusted_spread > -10:
            return 0.3
        else:
            return 0.2
    
    def _total_probability(self, predicted_total, line, bet_type):
        """Calculate probability of over/under hitting"""
        # Simplified calculation for MVP
        difference = predicted_total - line
        
        if bet_type == 'over':
            if difference > 10:
                return 0.8
            elif difference > 5:
                return 0.7
            elif difference > 0:
                return 0.6
            elif difference > -5:
                return 0.4
            else:
                return 0.3
        else:  # under
            if difference < -10:
                return 0.8
            elif difference < -5:
                return 0.7
            elif difference < 0:
                return 0.6
            elif difference < 5:
                return 0.4
            else:
                return 0.3
```

## Model Training and Evaluation

For the MVP, we'll use a simplified training and evaluation approach:

### Training Process

1. **Data Preparation**:
   - Collect 2-3 seasons of historical NBA data
   - Clean and preprocess data
   - Split into training (80%) and validation (20%) sets

2. **Model Training**:
   - Train statistical foundation model
   - Train machine learning enhancement model
   - Calibrate parlay probability calculator

3. **Evaluation Metrics**:
   - Accuracy of winner predictions
   - Mean absolute error for spread and total predictions
   - Brier score for probability calibration
   - Parlay success rate simulation

### Example Evaluation Implementation

```python
def evaluate_model(model, test_games):
    """Evaluate model performance on test set"""
    results = {
        'winner_correct': 0,
        'spread_errors': [],
        'total_errors': [],
        'brier_scores': []
    }
    
    for game in test_games:
        # Get actual results
        actual_winner = game['home_team_id'] if game['home_score'] > game['away_score'] else game['away_team_id']
        actual_spread = game['home_score'] - game['away_score']
        actual_total = game['home_score'] + game['away_score']
        
        # Get prediction
        prediction = model.predict_game(game['home_team_id'], game['away_team_id'], game['date'])
        
        # Check winner
        if prediction['predicted_winner'] == actual_winner:
            results['winner_correct'] += 1
            
        # Calculate spread error
        predicted_spread = prediction['predicted_spread'] * (1 if prediction['predicted_winner'] == game['home_team_id'] else -1)
        spread_error = abs(predicted_spread - actual_spread)
        results['spread_errors'].append(spread_error)
        
        # Calculate total error
        total_error = abs(prediction['predicted_total'] - actual_total)
        results['total_errors'].append(total_error)
        
        # Calculate Brier score (for probability calibration)
        p = prediction['win_probability'] if prediction['predicted_winner'] == game['home_team_id'] else 1 - prediction['win_probability']
        actual = 1 if game['home_score'] > game['away_score'] else 0
        brier_score = (p - actual) ** 2
        results['brier_scores'].append(brier_score)
    
    # Calculate summary statistics
    summary = {
        'winner_accuracy': results['winner_correct'] / len(test_games) if test_games else 0,
        'spread_mae': sum(results['spread_errors']) / len(results['spread_errors']) if results['spread_errors'] else 0,
        'total_mae': sum(results['total_errors']) / len(results['total_errors']) if results['total_errors'] else 0,
        'brier_score': sum(results['brier_scores']) / len(results['brier_scores']) if results['brier_scores'] else 0
    }
    
    return summary
```

## Model Deployment

For the MVP, we'll implement a simplified deployment approach:

### API Endpoints

```python
# Example Flask API for model deployment
from flask import Flask, request, jsonify
import pandas as pd
import json

app = Flask(__name__)

# Load models (would be initialized with actual data in production)
statistical_model = NBAStatisticalModel(pd.DataFrame(), pd.DataFrame())
ml_model = NBAMachineLearningModel(pd.DataFrame(), pd.DataFrame())
parlay_calculator = ParlayCalculator(ml_model)

@app.route('/api/predictions/game', methods=['POST'])
def predict_game():
    data = request.json
    
    home_team_id = data.get('home_team_id')
    away_team_id = data.get('away_team_id')
    game_date = data.get('game_date')
    
    # Get statistical prediction
    stat_prediction = statistical_model.predict_game(home_team_id, away_team_id, game_date)
    
    # Get ML prediction
    ml_prediction = ml_model.predict_game(home_team_id, away_team_id, game_date)
    
    # Combine predictions (simple average for MVP)
    combined_prediction = {
        'predicted_winner': ml_prediction['predicted_winner'],  # Prefer ML model for winner
        'win_probability': (stat_prediction['win_probability'] + ml_prediction['win_probability']) / 2,
        'predicted_spread': (stat_prediction['predicted_spread'] + ml_prediction['predicted_spread']) / 2,
        'predicted_total': (stat_prediction['predicted_total'] + ml_prediction['predicted_total']) / 2,
        'confidence': (stat_prediction['confidence'] + ml_prediction['confidence']) / 2
    }
    
    return jsonify(combined_prediction)

@app.route('/api/predictions/parlay', methods=['POST'])
def calculate_parlay():
    data = request.json
    bets = data.get('bets', [])
    
    result = parlay_calculator.calculate_parlay_probability(bets)
    
    return jsonify(result)

@app.route('/api/suggestions/parlays', methods=['GET'])
def suggest_parlays():
    # In production, this would query the database for upcoming games
    upcoming_games = []  # Placeholder
    
    suggestions = parlay_calculator.suggest_parlays(upcoming_games)
    
    return jsonify(suggestions)

if __name__ == '__main__':
    app.run(debug=True)
```

## Model Update Strategy

For the MVP, we'll implement a simple update strategy:

1. **Daily Updates**:
   - Update team and player statistics
   - Recalculate derived features

2. **Weekly Retraining**:
   - Incorporate new game results
   - Retrain machine learning models
   - Update model weights

3. **Performance Monitoring**:
   - Track prediction accuracy
   - Monitor probability calibration
   - Adjust confidence calculations

## Budget Considerations

Given our $1,000 budget constraint, we'll optimize the model development:

1. **Simplified Implementation**:
   - Focus on core statistical methods
   - Use lightweight ML algorithms
   - Implement basic parlay calculator

2. **Compute Efficiency**:
   - Batch predictions for upcoming games
   - Optimize database queries
   - Use efficient data structures

3. **Development Priorities**:
   - Accuracy of game winner predictions
   - Basic spread and total predictions
   - Simple parlay suggestions

## Implementation Timeline

| Week | Model Development Tasks |
|------|------------------------|
| 1 | Set up data processing pipeline and database schema |
| 1 | Implement statistical foundation model |
| 2 | Develop feature engineering for ML model |
| 2 | Train initial ML model on historical data |
| 3 | Implement parlay probability calculator |
| 3 | Create API endpoints for predictions |
| 4 | Integrate with frontend |
| 4 | Test and refine model performance |

## Future Enhancements

While out of scope for the MVP, we've designed the model architecture to support future enhancements:

1. **Advanced ML Techniques**:
   - Ensemble methods combining multiple models
   - Neural networks for pattern recognition
   - Time series analysis for trend detection

2. **Enhanced Features**:
   - Player-level impact modeling
   - Advanced matchup analysis
   - Referee tendencies

3. **Real-Time Updates**:
   - In-game prediction adjustments
   - Live odds comparison
   - Momentum tracking

## Conclusion

This predictive model development plan provides a balanced approach to creating an effective NBA betting prediction system within our budget constraints. By combining statistical methods with basic machine learning and focusing on the most critical features, we can deliver a functional MVP that provides value to users while establishing a foundation for future enhancements.

The model prioritizes accurate game winner predictions and parlay probability calculations, which align with our core MVP requirements. While more advanced features are left for future iterations, this approach allows us to deliver a working product quickly and within budget.
