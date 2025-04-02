// backend/server.js
const express = require('express');
const http = require('http') ;
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const gamesRoutes = require('./routes/games');
const riskAssessmentRoutes = require('./routes/riskAssessment');

const app = express();
const server = http.createServer(app) ;
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/games', gamesRoutes);
app.use('/api/risk-assessment', riskAssessmentRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join game room
  socket.on('join-game', (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`Client joined game-${gameId}`);
  });
  
  // Leave game room
  socket.on('leave-game', (gameId) => {
    socket.leave(`game-${gameId}`);
    console.log(`Client left game-${gameId}`);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/nba-betting', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
