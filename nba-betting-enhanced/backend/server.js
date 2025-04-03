// backend/server.js
const express = require('express');
const http = require('http') ;
const socketIo = require('socket.io');  // Make sure this import is present
const mongoose = require('mongoose');
const cors = require('cors');
const gamesRoutes = require('./routes/games');
const riskAssessmentRoutes = require('./routes/riskAssessment');

const app = express();
const server = http.createServer(app) ;
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
}) ;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}) );
app.use(express.json());

// Routes
app.use('/api/games', gamesRoutes);
app.use('/api/risk-assessment', riskAssessmentRoutes);

// Games namespace
const gamesNamespace = io.of('/games');
gamesNamespace.on('connection', (socket) => {
  console.log('Client connected to games namespace');
  
  // Join game room
  socket.on('join_game', (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`Client joined game-${gameId}`);
  });
  
  // Leave game room
  socket.on('leave_game', (gameId) => {
    socket.leave(`game-${gameId}`);
    console.log(`Client left game-${gameId}`);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected from games namespace');
  });
});

// Users namespace
const usersNamespace = io.of('/users');
usersNamespace.on('connection', (socket) => {
  console.log('Client connected to users namespace');
  
  // Authenticate user
  socket.on('authenticate', (userId) => {
    console.log(`User authenticated: ${userId}`);
    socket.join(`user-${userId}`);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected from users namespace');
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
