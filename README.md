# AI Coding Agent - Claude Style

A full-stack AI coding assistant that mimics Claude's interface, built with React and FastAPI, powered by Google's Gemini 2.5 API.

## 🚀 Features

- **Claude-style UI**: Clean chat interface with dynamic sidebar for code artifacts
- **Streaming Responses**: Real-time AI responses from Gemini 2.5 API
- **Code Artifacts**: Syntax-highlighted code viewer with preview capability
- **Memory**: Short-term conversation context using LangGraph
- **Modern Stack**: React + TypeScript, TailwindCSS, FastAPI, Zustand

## 📁 Project Structure

```
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/ # UI components (chat, sidebar, etc.)
│   │   ├── stores/     # Zustand state management
│   │   ├── services/   # API services
│   │   └── types/      # TypeScript definitions
│   └── package.json
└── backend/            # FastAPI backend
    ├── app/
    │   ├── routers/    # API routes
    │   ├── services/   # Business logic
    │   └── models/     # Pydantic schemas
    └── requirements.txt
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and build
- **TailwindCSS** for styling
- **Zustand** for state management
- **React Query** for API state
- **Monaco Editor** for code editing
- **React Markdown** for message rendering

### Backend
- **FastAPI** with Python
- **Gemini 2.5 Flash** (free tier)
- **LangGraph** for conversation memory
- **WebSocket** support for streaming
- **Pydantic** for data validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (we're using 18.20.7)
- Python 3.8+
- Gemini API key

### Setup

1. **Clone and navigate to project**
   ```bash
   cd zocket
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   # Edit backend/.env and add your Gemini API key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   source venv/bin/activate
   python app/main.py
   ```
   Backend will run on http://localhost:8000

2. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:5173

3. **Open your browser** and go to http://localhost:5173

## 🎯 Current Status

✅ **Completed:**
- Basic project structure
- Frontend UI with Claude-style layout
- Backend API foundation
- TailwindCSS styling setup
- Development servers running

🚧 **Next Steps:**
- Connect frontend to backend API
- Implement Gemini API integration
- Add streaming response functionality
- Implement conversation memory with LangGraph
- Add Monaco Editor for code editing
- Add preview functionality for generated code

## 📝 API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /chat` - Send chat messages (coming soon)
- `WebSocket /ws` - Real-time streaming (coming soon)

## 🔧 Development

The project is set up for rapid development:
- Frontend hot reload on file changes
- Backend auto-reload with uvicorn
- TypeScript for type safety
- Proper error handling and validation

Ready to continue building the core features!
