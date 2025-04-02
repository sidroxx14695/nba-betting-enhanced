from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import json
import os
from datetime import datetime
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.append(str(Path(__file__).parent.parent))

# Import our modules
from backend.database.db_setup import DB_PATH
from backend.api.nba_data import NBADataService
from backend.models.predictive_model import PredictiveModel

app = Flask(__name__, 
            template_folder=str(Path(__file__).parent.parent / 'frontend' / 'templates'),
            static_folder=str(Path(__file__).parent.parent / 'frontend' / 'static'))

# Secret key for session
app.secret_key = os.urandom(24)

# Initialize services
nba_service = NBADataService()
predictive_model = PredictiveModel()

# Load models if available, otherwise train them
try:
    predictive_model.load_models()
except:
    predictive_model.train_models()

# Routes
@app.route('/')
def index():
    """Render the home page"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Render the dashboard page"""
    # Check if user is logged in
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    return render_template('dashboard.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # For MVP, we'll use a simple authentication
        # In production, this would use proper password hashing
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT id, username FROM users WHERE username = ? AND password_hash = ?', 
                      (username, password))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            return redirect(url_for('dashboard'))
        
        return render_template('login.html', error='Invalid username or password')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email')
        
        # For MVP, we'll use a simple registration
        # In production, this would use proper password hashing
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if username already exists
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        if cursor.fetchone():
            conn.close()
            return render_template('register.html', error='Username already exists')
        
        # Insert new user
        cursor.execute(
            'INSERT INTO users (username, password_hash, email, created_at) VALUES (?, ?, ?, ?)',
            (username, password, email, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        )
        conn.commit()
        
        # Get the new user's ID
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        user_id = cursor.fetchone()[0]
        conn.close()
        
        # Log the user in
        session['user_id'] = user_id
        session['username'] = username
        
        return redirect(url_for('dashboard'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    """Handle user logout"""
    session.pop('user_id', None)
    session.pop('username', None)
    return redirect(url_for('index'))

@app.route('/api/games')
def get_games():
    """API endpoint to get upcoming games"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT g.id, g.game_date, g.status, 
           ht.name as home_team, at.name as away_team,
           g.home_score, g.away_score
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    ORDER BY g.game_date
    ''')
    
    games = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(games)

@app.route('/api/odds/<int:game_id>')
def get_odds(game_id):
    """API endpoint to get betting odds for a game"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT * FROM betting_odds
    WHERE game_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
    ''', (game_id,))
    
    odds = dict(cursor.fetchone() or {})
    conn.close()
    
    return jsonify(odds)

@app.route('/api/predictions/<int:game_id>')
def get_predictions(game_id):
    """API endpoint to get predictions for a game"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT prediction_type, prediction_value, confidence
    FROM predictions
    WHERE game_id = ?
    ORDER BY timestamp DESC
    ''', (game_id,))
    
    predictions = {}
    for row in cursor.fetchall():
        predictions[row['prediction_type']] = {
            'value': row['prediction_value'],
            'confidence': row['confidence']
        }
    
    conn.close()
    
    return jsonify(predictions)

@app.route('/api/place_bet', methods=['POST'])
def place_bet():
    """API endpoint to place a bet"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.json
    user_id = session['user_id']
    game_id = data.get('game_id')
    bet_type = data.get('bet_type')
    bet_amount = data.get('bet_amount')
    odds = data.get('odds')
    
    # Calculate potential payout
    potential_payout = calculate_payout(bet_amount, odds)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Insert the bet
    cursor.execute(
        '''INSERT INTO bets 
           (user_id, game_id, bet_type, bet_amount, odds, potential_payout, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (user_id, game_id, bet_type, bet_amount, odds, potential_payout, 'pending', 
         datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    )
    
    bet_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'bet_id': bet_id, 'potential_payout': potential_payout})

@app.route('/api/place_parlay', methods=['POST'])
def place_parlay():
    """API endpoint to place a parlay bet"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.json
    user_id = session['user_id']
    bet_amount = data.get('bet_amount')
    bets = data.get('bets', [])
    
    if not bets:
        return jsonify({'error': 'No bets in parlay'}), 400
    
    # Calculate total odds and potential payout
    total_odds = calculate_parlay_odds(bets)
    potential_payout = calculate_payout(bet_amount, total_odds)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Insert the parlay
    cursor.execute(
        '''INSERT INTO parlays 
           (user_id, bet_amount, total_odds, potential_payout, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (user_id, bet_amount, total_odds, potential_payout, 'pending', 
         datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    )
    
    parlay_id = cursor.lastrowid
    
    # Insert individual bets and link to parlay
    for bet in bets:
        game_id = bet.get('game_id')
        bet_type = bet.get('bet_type')
        odds = bet.get('odds')
        
        cursor.execute(
            '''INSERT INTO bets 
               (user_id, game_id, bet_type, bet_amount, odds, potential_payout, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (user_id, game_id, bet_type, 0, odds, 0, 'pending', 
             datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        )
        
        bet_id = cursor.lastrowid
        
        cursor.execute(
            '''INSERT INTO parlay_bets (parlay_id, bet_id) VALUES (?, ?)''',
            (parlay_id, bet_id)
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({'parlay_id': parlay_id, 'potential_payout': potential_payout})

@app.route('/api/user_bets')
def get_user_bets():
    """API endpoint to get a user's bets"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user_id = session['user_id']
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get single bets
    cursor.execute('''
    SELECT b.id, b.game_id, b.bet_type, b.bet_amount, b.odds, b.potential_payout, b.status, b.created_at,
           g.game_date, ht.name as home_team, at.name as away_team
    FROM bets b
    JOIN games g ON b.game_id = g.id
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    WHERE b.user_id = ? AND b.id NOT IN (SELECT bet_id FROM parlay_bets)
    ORDER BY b.created_at DESC
    ''', (user_id,))
    
    single_bets = [dict(row) for row in cursor.fetchall()]
    
    # Get parlays
    cursor.execute('''
    SELECT p.id, p.bet_amount, p.total_odds, p.potential_payout, p.status, p.created_at
    FROM parlays p
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    ''', (user_id,))
    
    parlays = []
    for row in cursor.fetchall():
        parlay = dict(row)
        
        # Get the bets in this parlay
        cursor.execute('''
        SELECT b.id, b.game_id, b.bet_type, b.odds, b.status,
               g.game_date, ht.name as home_team, at.name as away_team
        FROM parlay_bets pb
        JOIN bets b ON pb.bet_id = b.id
        JOIN games g ON b.game_id = g.id
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        WHERE pb.parlay_id = ?
        ''', (parlay['id'],))
        
        parlay['bets'] = [dict(bet_row) for bet_row in cursor.fetchall()]
        parlays.append(parlay)
    
    conn.close()
    
    return jsonify({'single_bets': single_bets, 'parlays': parlays})

@app.route('/api/risk_profile', methods=['GET', 'POST'])
def risk_profile():
    """API endpoint to get or update a user's risk profile"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user_id = session['user_id']
    
    if request.method == 'POST':
        data = request.json
        risk_profile = data.get('risk_profile')
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET risk_profile = ? WHERE id = ?', (risk_profile, user_id))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT risk_profile FROM users WHERE id = ?', (user_id,))
    risk_profile = cursor.fetchone()[0]
    conn.close()
    
    return jsonify({'risk_profile': risk_profile})

# Helper functions
def calculate_payout(bet_amount, odds):
    """Calculate potential payout based on bet amount and odds"""
    if odds > 0:
        return bet_amount * (odds / 100)
    else:
        return bet_amount * (100 / abs(odds))

def calculate_parlay_odds(bets):
    """Calculate total odds for a parlay"""
    # Convert American odds to decimal
    decimal_odds = []
    for bet in bets:
        odds = bet.get('odds')
        if odds > 0:
            decimal_odds.append(1 + (odds / 100))
        else:
            decimal_odds.append(1 + (100 / abs(odds)))
    
    # Multiply all decimal odds
    total_decimal = 1
    for odd in decimal_odds:
        total_decimal *= odd
    
    # Convert back to American odds
    if total_decimal >= 2:
        return (total_decimal - 1) * 100
    else:
        return -100 / (total_decimal - 1)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
