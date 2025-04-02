import sqlite3
from flask import session
from pathlib import Path

# Database path
data_dir = Path(__file__).parent.parent.parent / 'data'
DB_PATH = data_dir / 'nba_betting.db'

class BettingStrategyService:
    """Service to handle user-specific betting strategies based on risk profile"""
    
    def __init__(self):
        self.conn = sqlite3.connect(str(DB_PATH))
        self.conn.row_factory = sqlite3.Row
    
    def get_user_risk_profile(self, user_id):
        """Get the user's risk profile"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT risk_profile FROM users WHERE id = ?', (user_id,))
        result = cursor.fetchone()
        return result['risk_profile'] if result else 'moderate'
    
    def get_recommended_bets(self, user_id, game_id=None):
        """Get recommended bets based on user's risk profile and prediction confidence"""
        risk_profile = self.get_user_risk_profile(user_id)
        
        # Set confidence threshold based on risk profile
        if risk_profile == 'conservative':
            confidence_threshold = 0.75
            max_bet_percentage = 0.05  # 5% of bankroll
        elif risk_profile == 'moderate':
            confidence_threshold = 0.65
            max_bet_percentage = 0.10  # 10% of bankroll
        else:  # aggressive
            confidence_threshold = 0.55
            max_bet_percentage = 0.15  # 15% of bankroll
        
        cursor = self.conn.cursor()
        
        # Get user's bankroll (for demo, we'll use a fixed amount)
        bankroll = 1000
        
        # Query to get games with high-confidence predictions
        query = '''
        SELECT g.id, g.game_date, ht.name as home_team, at.name as away_team,
               p.prediction_type, p.prediction_value, p.confidence,
               bo.home_moneyline, bo.away_moneyline, bo.spread, bo.over_under
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        JOIN predictions p ON g.id = p.game_id
        JOIN betting_odds bo ON g.id = bo.game_id
        WHERE p.confidence >= ? AND g.status = 'Scheduled'
        '''
        
        params = [confidence_threshold]
        
        if game_id:
            query += ' AND g.id = ?'
            params.append(game_id)
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        recommendations = []
        for row in results:
            bet_type = row['prediction_type']
            prediction = row['prediction_value']
            confidence = row['confidence']
            
            # Calculate recommended bet amount
            recommended_amount = round(bankroll * max_bet_percentage * confidence, 2)
            
            # Determine the specific bet recommendation based on prediction type
            if bet_type == 'spread':
                # If prediction is positive, bet on home team; if negative, bet on away team
                if prediction > 0:
                    recommendation = {
                        'game_id': row['id'],
                        'home_team': row['home_team'],
                        'away_team': row['away_team'],
                        'bet_type': 'spread',
                        'bet_description': f"{row['home_team']} {row['spread']}",
                        'odds': row['home_moneyline'],
                        'confidence': confidence,
                        'recommended_amount': recommended_amount
                    }
                else:
                    recommendation = {
                        'game_id': row['id'],
                        'home_team': row['home_team'],
                        'away_team': row['away_team'],
                        'bet_type': 'spread',
                        'bet_description': f"{row['away_team']} +{abs(row['spread'])}",
                        'odds': row['away_moneyline'],
                        'confidence': confidence,
                        'recommended_amount': recommended_amount
                    }
            
            elif bet_type == 'moneyline':
                # If prediction > 0.5, bet on home team; otherwise, bet on away team
                if prediction > 0.5:
                    recommendation = {
                        'game_id': row['id'],
                        'home_team': row['home_team'],
                        'away_team': row['away_team'],
                        'bet_type': 'moneyline',
                        'bet_description': f"{row['home_team']} ML",
                        'odds': row['home_moneyline'],
                        'confidence': confidence,
                        'recommended_amount': recommended_amount
                    }
                else:
                    recommendation = {
                        'game_id': row['id'],
                        'home_team': row['home_team'],
                        'away_team': row['away_team'],
                        'bet_type': 'moneyline',
                        'bet_description': f"{row['away_team']} ML",
                        'odds': row['away_moneyline'],
                        'confidence': confidence,
                        'recommended_amount': recommended_amount
                    }
            
            elif bet_type == 'total':
                # If prediction > over/under line, bet over; otherwise, bet under
                if prediction > row['over_under']:
                    recommendation = {
                        'game_id': row['id'],
                        'home_team': row['home_team'],
                        'away_team': row['away_team'],
                        'bet_type': 'total',
                        'bet_description': f"Over {row['over_under']}",
                        'odds': -110,  # Typical odds for over/under
                        'confidence': confidence,
                        'recommended_amount': recommended_amount
                    }
                else:
                    recommendation = {
                        'game_id': row['id'],
                        'home_team': row['home_team'],
                        'away_team': row['away_team'],
                        'bet_type': 'total',
                        'bet_description': f"Under {row['over_under']}",
                        'odds': -110,  # Typical odds for over/under
                        'confidence': confidence,
                        'recommended_amount': recommended_amount
                    }
            
            recommendations.append(recommendation)
        
        self.conn.close()
        return recommendations
    
    def get_parlay_recommendations(self, user_id):
        """Get recommended parlays based on user's risk profile"""
        risk_profile = self.get_user_risk_profile(user_id)
        
        # Set parameters based on risk profile
        if risk_profile == 'conservative':
            confidence_threshold = 0.75
            max_legs = 2
            max_bet_percentage = 0.02  # 2% of bankroll
        elif risk_profile == 'moderate':
            confidence_threshold = 0.65
            max_legs = 3
            max_bet_percentage = 0.05  # 5% of bankroll
        else:  # aggressive
            confidence_threshold = 0.60
            max_legs = 4
            max_bet_percentage = 0.08  # 8% of bankroll
        
        # Get individual bet recommendations
        individual_bets = self.get_recommended_bets(user_id)
        
        # Sort by confidence
        individual_bets.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Take top bets for parlay
        parlay_bets = individual_bets[:max_legs]
        
        if len(parlay_bets) < 2:
            return None  # Need at least 2 bets for a parlay
        
        # Calculate parlay odds
        decimal_odds = []
        for bet in parlay_bets:
            odds = bet['odds']
            if odds > 0:
                decimal_odds.append(1 + (odds / 100))
            else:
                decimal_odds.append(1 + (100 / abs(odds)))
        
        total_decimal = 1
        for odd in decimal_odds:
            total_decimal *= odd
        
        if total_decimal >= 2:
            total_odds = round((total_decimal - 1) * 100)
        else:
            total_odds = round(-100 / (total_decimal - 1))
        
        # Calculate recommended bet amount
        bankroll = 1000  # Fixed for demo
        recommended_amount = round(bankroll * max_bet_percentage, 2)
        
        # Calculate potential payout
        if total_odds > 0:
            potential_payout = recommended_amount * (total_odds / 100)
        else:
            potential_payout = recommended_amount * (100 / abs(total_odds))
        
        return {
            'bets': parlay_bets,
            'total_odds': total_odds,
            'recommended_amount': recommended_amount,
            'potential_payout': round(potential_payout, 2)
        }
