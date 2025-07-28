#!/bin/bash

echo "🚀 Starting backend..."
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
