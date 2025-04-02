// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load upcoming games on home page
    if (document.getElementById('games-container')) {
        loadUpcomingGames();
    }
});

// Load upcoming games
function loadUpcomingGames() {
    fetch('/api/games')
        .then(response => response.json())
        .then(games => {
            const gamesContainer = document.getElementById('games-container');
            gamesContainer.innerHTML = '';
            
            if (games.length === 0) {
                gamesContainer.innerHTML = '<div class="no-games">No upcoming games found</div>';
                return;
            }
            
            games.forEach(game => {
                const gameDate = new Date(game.game_date);
                const gameCard = document.createElement('div');
                gameCard.className = 'game-card';
                gameCard.innerHTML = `
                    <div class="game-teams">
                        <div class="team home-team">${game.home_team}</div>
                        <div class="vs">vs</div>
                        <div class="team away-team">${game.away_team}</div>
                    </div>
                    <div class="game-info">
                        <div class="game-date">${gameDate.toLocaleDateString()}</div>
                        <div class="game-time">${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                `;
                
                // Add view odds button if user is logged in
                if (window.userLoggedIn) {
                    gameCard.innerHTML += `<a href="/dashboard?game=${game.id}" class="btn btn-sm">View Odds</a>`;
                }
                
                gamesContainer.appendChild(gameCard);
            });
        })
        .catch(error => {
            console.error('Error fetching games:', error);
            const gamesContainer = document.getElementById('games-container');
            gamesContainer.innerHTML = '<div class="error">Error loading games</div>';
        });
}
