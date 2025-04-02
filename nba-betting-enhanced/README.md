# Enhanced NBA Betting MVP

A real-time NBA betting platform with in-game predictions and personalized risk profiling.

## Features

- Real-time in-game prediction updates via WebSockets
- Personalized risk profiling system
- Dynamic bet sizing recommendations
- Parlay builder with win probability visualization
- Live win probability and score projection charts

## Tech Stack

### Backend
- Node.js/Express
- Socket.IO for real-time WebSocket communication
- MongoDB for data storage
- Redis for caching and pub/sub messaging
- Bull for job queues and scheduled tasks

### Frontend
- React with TypeScript
- Redux for state management
- Socket.IO Client for real-time updates
- Recharts for data visualization
- Framer Motion for animations
- Tailwind CSS for styling

## Project Structure

```
nba-betting-enhanced/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   └── server.js         # Main server file
└── frontend/
    ├── public/           # Static assets
    └── src/
        ├── components/   # React components
        ├── contexts/     # React contexts
        ├── pages/        # Page components
        ├── store/        # Redux store
        └── App.tsx       # Main application component
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- Redis

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/nba-betting-enhanced.git
cd nba-betting-enhanced
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Install frontend dependencies
```
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```
cd backend
npm run dev
```

2. Start the frontend development server
```
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Deployment

The application can be deployed using various cloud services:

- Backend: Render, Heroku, or AWS
- Frontend: Netlify, Vercel, or GitHub Pages
- Database: MongoDB Atlas
- Redis: Redis Cloud

## License

This project is licensed under the MIT License - see the LICENSE file for details.
