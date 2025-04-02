// Dashboard JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load user's risk profile
    loadRiskProfile();
    
    // Load upcoming games
    loadUpcomingGames();
    
    // Load user's bets
    loadUserBets();
    
    // Set up tab switching
    setupTabs();
    
    // Set up risk profile saving
    document.getElementById('save-risk-profile').addEventListener('click', saveRiskProfile);
    
    // Set up parlay bet amount calculation
    document.getElementById('parlay-amount').addEventListener('input', updateParlayPayout);
    
    // Set up place parlay button
    document.getElementById('place-parlay').addEventListener('click', placeParlayBet);
});

// Global variables to store state
let selectedGame = null;
let selectedBetType = null;
let selectedBetOdds = null;
let parlayBets = [];

// Load user's risk profile
function loadRiskProfile() {
    fetch('/api/risk_profile')
        .then(response => response.json())
        .then(data => {
            if (data.risk_profile) {
                document.getElementById('risk-profile').value = data.risk_profile;
            }
        })
        .catch(error => {
            console.error('Error loading risk profile:', error);
        });
}

// Save user's risk profile
function saveRiskProfile() {
    const riskProfile = document.getElementById('risk-profile').value;
    
    fetch('/api/risk_profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ risk_profile: riskProfile })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Risk profile saved successfully');
            }
        })
        .catch(error => {
            console.error('Error saving risk profile:', error);
            alert('Error saving risk profile');
        });
}

// Load upcoming games
function loadUpcomingGames() {
    fetch('/api/games')
        .then(response => response.json())
        .then(games => {
            const gamesContainer = document.getElementById('dashboard-games');
            gamesContainer.innerHTML = '';
            
            if (games.length === 0) {
                gamesContainer.innerHTML = '<div class="no-games">No upcoming games found</div>';
                return;
            }
            
            games.forEach(game => {
                const gameDate = new Date(game.game_date);
                const gameItem = document.createElement('div');
                gameItem.className = 'dashboard-game-item';
                gameItem.dataset.gameId = game.id;
                gameItem.innerHTML = `
                    <div class="dashboard-game-teams">${game.home_team} vs ${game.away_team}</div>
                    <div class="dashboard-game-date">${gameDate.toLocaleDateString()} ${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                `;
                gameItem.addEventListener('click', () => loadGameDetails(game));
                gamesContainer.appendChild(gameItem);
            });
        })
        .catch(error => {
            console.error('Error loading games:', error);
            const gamesContainer = document.getElementById('dashboard-games');
            gamesContainer.innerHTML = '<div class="error">Error loading games</div>';
        });
}

// Load game details
function loadGameDetails(game) {
    selectedGame = game;
    
    // Update active game in list
    const gameItems = document.querySelectorAll('.dashboard-game-item');
    gameItems.forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.gameId) === game.id) {
            item.classList.add('active');
        }
    });
    
    const gameDetailsContainer = document.getElementById('game-details');
    
    // Show loading state
    gameDetailsContainer.innerHTML = `
        <h3>Game Details</h3>
        <div class="loading">Loading game details...</div>
    `;
    
    // Load odds and predictions
    Promise.all([
        fetch(`/api/odds/${game.id}`).then(res => res.json()),
        fetch(`/api/predictions/${game.id}`).then(res => res.json())
    ])
        .then(([odds, predictions]) => {
            const gameDate = new Date(game.game_date);
            
            // Reset selected bet
            selectedBetType = null;
            selectedBetOdds = null;
            
            gameDetailsContainer.innerHTML = `
                <h3>Game Details</h3>
                <div class="game-details-content">
                    <div class="game-header">
                        <div class="game-date">${gameDate.toLocaleDateString()} ${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div class="game-status">${game.status}</div>
                    </div>
                    
                    <div class="game-teams-large">
                        <div class="team-large">
                            <div class="team-name">${game.home_team}</div>
                            <div class="team-score">${game.home_score || '-'}</div>
                        </div>
                        <div class="vs-large">VS</div>
                        <div class="team-large">
                            <div class="team-name">${game.away_team}</div>
                            <div class="team-score">${game.away_score || '-'}</div>
                        </div>
                    </div>
                    
                    <h4>Betting Options</h4>
                    <div class="betting-options">
                        <div class="bet-option" data-type="spread" data-odds="${odds.home_spread_odds || -110}">
                            <div class="bet-type">Spread</div>
                            <div class="bet-odds">${game.home_team} ${odds.spread || '-3.5'} (${odds.home_spread_odds || -110})</div>
                            <div class="bet-prediction">Prediction: ${predictions.spread ? predictions.spread.value.toFixed(1) : 'N/A'}</div>
                            <div class="bet-confidence">Confidence: ${predictions.spread ? Math.round(predictions.spread.confidence * 100) + '%' : 'N/A'}</div>
                        </div>
                        <div class="bet-option" data-type="moneyline" data-odds="${odds.home_moneyline || -150}">
                            <div class="bet-type">Moneyline</div>
                            <div class="bet-odds">${game.home_team} (${odds.home_moneyline || -150})</div>
                            <div class="bet-prediction">Prediction: ${predictions.moneyline ? Math.round(predictions.moneyline.value * 100) + '%' : 'N/A'}</div>
                            <div class="bet-confidence">Confidence: ${predictions.moneyline ? Math.round(predictions.moneyline.confidence * 100) + '%' : 'N/A'}</div>
                        </div>
                        <div class="bet-option" data-type="total" data-odds="${odds.over_odds || -110}">
                            <div class="bet-type">Total Points</div>
                            <div class="bet-odds">Over ${odds.over_under || '220.5'} (${odds.over_odds || -110})</div>
                            <div class="bet-prediction">Prediction: ${predictions.total ? predictions.total.value.toFixed(1) : 'N/A'}</div>
                            <div class="bet-confidence">Confidence: ${predictions.total ? Math.round(predictions.total.confidence * 100) + '%' : 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="bet-controls">
                        <div class="bet-amount">
                            <label for="bet-amount">Bet Amount ($):</label>
                            <input type="number" id="bet-amount" min="1" value="10">
                        </div>
                        <div class="potential-payout">
                            Potential Payout: $<span id="potential-payout">0.00</span>
                        </div>
                        <button id="place-bet" class="btn btn-primary" disabled>Place Bet</button>
                        <button id="add-to-parlay" class="btn btn-secondary" disabled>Add to Parlay</button>
                    </div>
                </div>
            `;
            
            // Show the content
            document.querySelector('.game-details-content').style.display = 'block';
            
            // Set up bet option selection
            const betOptions = document.querySelectorAll('.bet-option');
            betOptions.forEach(option => {
                option.addEventListener('click', () => {
                    betOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    
                    selectedBetType = option.dataset.type;
                    selectedBetOdds = parseInt(option.dataset.odds);
                    
                    // Update potential payout
                    updatePotentialPayout();
                    
                    // Enable buttons
                    document.getElementById('place-bet').disabled = false;
                    document.getElementById('add-to-parlay').disabled = false;
                });
            });
            
            // Set up bet amount input
            document.getElementById('bet-amount').addEventListener('input', updatePotentialPayout);
            
            // Set up place bet button
            document.getElementById('place-bet').addEventListener('click', placeBet);
            
            // Set up add to parlay button
            document.getElementById('add-to-parlay').addEventListener('click', addToParlay);
        })
        .catch(error => {
            console.error('Error loading game details:', error);
            gameDetailsContainer.innerHTML = `
                <h3>Game Details</h3>
                <div class="error">Error loading game details</div>
            `;
        });
}

// Update potential payout for single bet
function updatePotentialPayout() {
    if (!selectedBetOdds) return;
    
    const betAmount = parseFloat(document.getElementById('bet-amount').value) || 0;
    const payout = calculatePayout(betAmount, selectedBetOdds);
    
    document.getElementById('potential-payout').textContent = payout.toFixed(2);
}

// Update potential payout for parlay
function updateParlayPayout() {
    if (parlayBets.length === 0) return;
    
    const betAmount = parseFloat(document.getElementById('parlay-amount').value) || 0;
    const totalOdds = calculateParlayOdds(parlayBets);
    const payout = calculatePayout(betAmount, totalOdds);
    
    document.getElementById('parlay-odds-value').textContent = totalOdds > 0 ? '+' + totalOdds : totalOdds;
    document.getElementById('parlay-payout').textContent = payout.toFixed(2);
}

// Calculate potential payout based on bet amount and odds
function calculatePayout(betAmount, odds) {
    if (odds > 0) {
        return betAmount * (odds / 100);
    } else {
        return betAmount * (100 / Math.abs(odds));
    }
}

// Calculate total odds for a parlay
function calculateParlayOdds(bets) {
    // Convert American odds to decimal
    const decimalOdds = bets.map(bet => {
        const odds = bet.odds;
        if (odds > 0) {
            return 1 + (odds / 100);
        } else {
            return 1 + (100 / Math.abs(odds));
        }
    });
    
    // Multiply all decimal odds
    const totalDecimal = decimalOdds.reduce((acc, odd) => acc * odd, 1);
    
    // Convert back to American odds
    if (totalDecimal >= 2) {
        return Math.round((totalDecimal - 1) * 100);
    } else {
        return Math.round(-100 / (totalDecimal - 1));
    }
}

// Place a single bet
function placeBet() {
    if (!selectedGame || !selectedBetType || !selectedBetOdds) {
        alert('Please select a bet option');
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('bet-amount').value) || 0;
    if (betAmount <= 0) {
        alert('Please enter a valid bet amount');
        return;
    }
    
    const betData = {
        game_id: selectedGame.id,
        bet_type: selectedBetType,
        bet_amount: betAmount,
        odds: selectedBetOdds
    };
    
    fetch('/api/place_bet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(betData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.bet_id) {
                alert(`Bet placed successfully! Potential payout: $${data.potential_payout.toFixed(2)}`);
                loadUserBets();
            } else {
                alert('Error placing bet: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error placing bet:', error);
            alert('Error placing bet');
        });
}

// Add a bet to parlay
function addToParlay() {
    if (!selectedGame || !selectedBetType || !selectedBetOdds) {
        alert('Please select a bet option');
        return;
    }
    
    // Check if this game is already in the parlay
    const existingBet = parlayBets.find(bet => bet.game_id === selectedGame.id);
    if (existingBet) {
        alert('This game is already in your parlay');
        return;
    }
    
    // Add to parlay
    const betData = {
        game_id: selectedGame.id,
        bet_type: selectedBetType,
        odds: selectedBetOdds,
        home_team: selectedGame.home_team,
        away_team: selectedGame.away_team
    };
    
    parlayBets.push(betData);
    
    // Update parlay display
    updateParlayDisplay();
    
    // Update parlay payout
    updateParlayPayout();
    
    // Enable place parlay button
    document.getElementById('place-parlay').disabled = false;
    
    alert('Bet added to parlay');
}

// Update parlay display
function updateParlayDisplay() {
    const parlayBetsContainer = document.getElementById('parlay-bets');
    
    if (parlayBets.length === 0) {
        parlayBetsContainer.innerHTML = '<div class="no-bets">No bets added to parlay</div>';
        return;
    }
    
    parlayBetsContainer.innerHTML = '';
    
    parlayBets.forEach((bet, index) => {
        const betItem = document.createElement('div');
        betItem.className = 'parlay-bet-item';
        betItem.innerHTML = `
            <div class="parlay-bet-info">
                <div class="parlay-bet-teams">${bet.home_team} vs ${bet.away_team}</div>
                <div class="parlay-bet-type">${formatBetType(bet.bet_type)}</div>
            </div>
            <div class="parlay-bet-odds">${bet.odds > 0 ? '+' + bet.odds : bet.odds}</div>
            <div class="parlay-bet-remove" data-index="${index}">✕</div>
        `;
        parlayBetsContainer.appendChild(betItem);
    });
    
    // Set up remove buttons
    document.querySelectorAll('.parlay-bet-remove').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index);
            parlayBets.splice(index, 1);
            updateParlayDisplay();
            updateParlayPayout();
            
            // Disable place parlay button if no bets
            document.getElementById('place-parlay').disabled = parlayBets.length === 0;
        });
    });
}

// Format bet type for display
function formatBetType(betType) {
    switch (betType) {
        case 'spread':
            return 'Spread';
        case 'moneyline':
            return 'Moneyline';
        case 'total':
            return 'Over/Under';
        default:
            return betType;
    }
}

// Place a parlay bet
function placeParlayBet() {
    if (parlayBets.length < 2) {
        alert('A parlay must have at least 2 bets');
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('parlay-amount').value) || 0;
    if (betAmount <= 0) {
        alert('Please enter a valid bet amount');
        return;
    }
    
    const parlayData = {
        bet_amount: betAmount,
        bets: parlayBets
    };
    
    fetch('/api/place_parlay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(parlayData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.parlay_id) {
                alert(`Parlay placed successfully! Potential payout: $${data.potential_payout.toFixed(2)}`);
                
                // Clear parlay
                parlayBets = [];
                updateParlayDisplay();
                document.getElementById('place-parlay').disabled = true;
                
                // Reload user bets
                loadUserBets();
            } else {
                alert('Error placing parlay: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error placing parlay:', error);
            alert('Error placing parlay');
        });
}

// Load user's bets
function loadUserBets() {
    fetch('/api/user_bets')
        .then(response => response.json())
        .then(data => {
            // Single bets
            const singleBetsContainer = document.getElementById('single-bets');
            if (data.single_bets && data.single_bets.length > 0) {
                singleBetsContainer.innerHTML = '';
                
                data.single_bets.forEach(bet => {
                    const betDate = new Date(bet.created_at);
                    const betItem = document.createElement('div');
                    betItem.className = 'bet-item';
                    betItem.innerHTML = `
                        <div class="bet-item-header">
                            <div class="bet-item-teams">${bet.home_team} vs ${bet.away_team}</div>
                            <div class="bet-item-date">${betDate.toLocaleDateString()}</div>
                        </div>
                        <div class="bet-item-details">
                            <div class="bet-item-type">${formatBetType(bet.bet_type)}</div>
                            <div class="bet-item-amount">$${bet.bet_amount.toFixed(2)} @ ${bet.odds > 0 ? '+' + bet.odds : bet.odds}</div>
                        </div>
                        <div class="bet-item-status">
                            <div class="status-${bet.status.toLowerCase()}">${bet.status}</div>
                            <div>Potential Payout: $${bet.potential_payout.toFixed(2)}</div>
                        </div>
                    `;
                    singleBetsContainer.appendChild(betItem);
                });
            } else {
                singleBetsContainer.innerHTML = '<div class="no-bets">No single bets found</div>';
            }
            
            // Parlays
            const parlaysContainer = document.getElementById('parlays');
            if (data.parlays && data.parlays.length > 0) {
                parlaysContainer.innerHTML = '';
                
                data.parlays.forEach(parlay => {
                    const parlayDate = new Date(parlay.created_at);
                    const parlayItem = document.createElement('div');
                    parlayItem.className = 'parlay-item';
                    
                    let parlayBetsHtml = '';
                    if (parlay.bets && parlay.bets.length > 0) {
                        parlayBetsHtml = '<div class="parlay-item-bets">';
                        parlay.bets.forEach(bet => {
                            parlayBetsHtml += `
                                <div class="parlay-item-bet">
                                    <div>${bet.home_team} vs ${bet.away_team}: ${formatBetType(bet.bet_type)}</div>
                                    <div>${bet.odds > 0 ? '+' + bet.odds : bet.odds}</div>
                                </div>
                            `;
                        });
                        parlayBetsHtml += '</div>';
                    }
                    
                    parlayItem.innerHTML = `
                        <div class="parlay-item-header">
                            <div class="parlay-item-teams">${parlay.bets.length}-Leg Parlay</div>
                            <div class="parlay-item-date">${parlayDate.toLocaleDateString()}</div>
                        </div>
                        <div class="parlay-item-details">
                            <div class="parlay-item-type">Parlay</div>
                            <div class="parlay-item-amount">$${parlay.bet_amount.toFixed(2)} @ ${parlay.total_odds > 0 ? '+' + parlay.total_odds : parlay.total_odds}</div>
                        </div>
                        <div class="bet-item-status">
                            <div class="status-${parlay.status.toLowerCase()}">${parlay.status}</div>
                            <div>Potential Payout: $${parlay.potential_payout.toFixed(2)}</div>
                        </div>
                        ${parlayBetsHtml}
                    `;
                    parlaysContainer.appendChild(parlayItem);
                });
            } else {
                parlaysContainer.innerHTML = '<div class="no-bets">No parlays found</div>';
            }
        })
        .catch(error => {
            console.error('Error loading user bets:', error);
            document.getElementById('single-bets').innerHTML = '<div class="error">Error loading bets</div>';
            document.getElementById('parlays').innerHTML = '<div class="error">Error loading parlays</div>';
        });
}

// Set up tab switching
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show active tab pane
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabId) {
                    pane.classList.add('active');
                }
            });
        });
    });
}
