# Catan Companion

A web-based companion app for **The Settlers of Catan** that gives you a strategic edge during your games. Set up your board, place your settlements, and get real-time probability analysis, resource insights, and actionable recommendations to make smarter decisions at every turn.

## What It Does

Catan Companion acts as an analytical assistant that sits alongside your physical board game. You replicate your board layout in the app, then track your settlements as the game progresses. In return, it calculates dice probabilities, identifies resource weaknesses, suggests optimal moves, and helps you understand the true value of every position on the board.

## How to Use It

1. **Set up your board** - Reproduce your physical Catan board by assigning resources and dice values to each of the 19 tiles, then configure the coastal ports. The app validates your setup against official Catan distribution rules.
2. **Place your settlements** - Click vertex positions on the interactive board to place colonies, upgrade to cities, or mark opponent settlements.
3. **Read your analytics** - As you build, the sidebar updates with production probabilities, trading rates, resource scarcity, and victory point tracking.
4. **Follow the tips** - The app generates strategic recommendations: which resources you're missing, where to place the robber, which colony to upgrade next, and which ports to target.
5. **Share your board** - Send a link to other players so they can analyze the same board layout independently.

## Features

- **Interactive hex board** - Click to place colonies, cities, and mark opponents
- **Production statistics** - Per-resource and per-dice-value probability breakdowns, with visual production bars
- **Smart tips** - Warns about missing resources, weak production, port synergies, optimal robber placement, and best city upgrade targets
- **Trading rates** - See your effective trading ratio for each resource based on port access (2:1, 3:1, or 4:1)
- **Resource scarcity** - Board-wide resource availability showing which resources are rare and valuable
- **Victory point tracker** - Colony/city counts with toggles for Longest Road and Largest Army bonuses
- **Robber tracking** - Place the robber to see its impact on your production and get opponent-blocking recommendations
- **Game sharing** - Clone and share your board setup via URL
- **Dark mode** - Toggle between light and dark themes
- **Manual or image setup** - Configure the board manually or upload a screenshot

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Nginx |
| Backend | Flask (Python 3.11), Gunicorn |
| Database | MongoDB 8.0 |
| Deployment | Docker Compose |

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Run

```sh
docker compose up --build
```

The app will be available at **http://localhost:3000**.

### Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `MONGO_URI` | api | MongoDB connection string (default: `mongodb://mongo:27017`) |
| `MONGO_DB` | api | Database name (default: `catan`) |
| `REACT_APP_API_URL` | frontend | API base URL (default: empty, uses nginx proxy) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/games` | Create a game with manual board setup |
| `POST` | `/api/games/parse` | Create a game from a board screenshot |
| `GET` | `/api/games/:id` | Get full game state |
| `PATCH` | `/api/games/:id/settlements/:position` | Cycle settlement state (available > colony > city > opponent > remove) |
| `PATCH` | `/api/games/:id/robber/:tile_index` | Place or remove the robber |
| `POST` | `/api/games/:id/clone` | Clone a game for sharing |

## How to Play

1. **Setup** - Configure your Catan board by selecting resources and numbers for each tile, then set the ports
2. **Place settlements** - Click on numbered positions on the board to cycle through: available > colony > city > opponent > remove
3. **Read statistics** - The sidebar shows your resource probabilities, tips, trading rates, and more
4. **Track the robber** - Click any tile to place/remove the robber and see its impact
5. **Share** - Click "Share" to create a copy of your board and copy the link

## Development

### Run services individually

```sh
# Start MongoDB
docker compose up -d mongo

# Run the API locally
cd api
pip install -r requirements.txt
MONGO_URI=mongodb://localhost:27017 MONGO_DB=catan flask --app app:create_app run --port 5001

# Run the frontend locally
cd frontend
npm install
npm start
```

### Makefile

```sh
make build     # Build all Docker images
make up        # Start all services
make down      # Stop all services
make restart   # Stop and restart all services
make lint      # Run black + isort on the API code
make clean     # Remove __pycache__ directories
```
