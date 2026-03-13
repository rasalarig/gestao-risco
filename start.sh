#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo " GRC Pro - Platform Startup"
echo "============================================"

# 1. Start PostgreSQL via docker-compose
echo ""
echo "[1/5] Starting PostgreSQL..."
cd "$PROJECT_DIR"
docker-compose up -d postgres
echo "Waiting for PostgreSQL to be ready..."
sleep 3

# 2. Set up Python virtual environment and install backend dependencies
echo ""
echo "[2/5] Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt

# 3. Run database migrations
echo ""
echo "[3/5] Running database migrations..."
cd "$PROJECT_DIR/backend"
alembic upgrade head

# 4. Start backend server
echo ""
echo "[4/5] Starting backend (uvicorn on port 8000)..."
cd "$PROJECT_DIR/backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 5. Install frontend dependencies and start Angular
echo ""
echo "[5/5] Installing frontend dependencies and starting Angular..."
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  npm install
fi
npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "============================================"
echo " All services started!"
echo " Backend:  http://localhost:8000"
echo " Frontend: http://localhost:4200"
echo " API Docs: http://localhost:8000/api/docs"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap to clean up on exit
cleanup() {
  echo ""
  echo "Stopping services..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" stop
  echo "All services stopped."
}
trap cleanup EXIT INT TERM

wait
