# AI Coding Agent - Claude Style

A full-stack AI coding assistant that replicates Claude's interface, built with React and FastAPI, powered by Google's Gemini 2.5 API with LangGraph memory.

## 🚀 Features

- **Claude-style UI**: Clean chat interface with collapsible sidebar for code artifacts
- **Streaming Responses**: Real-time AI responses with Server-Sent Events (SSE)
- **Code Artifacts**: Syntax-highlighted code viewer with scroll support and download functionality
- **Conversation Memory**: Persistent conversation context using LangGraph
- **Download System**: Individual and bulk artifact download with proper file extensions
- **Auto-scroll Chat**: Automatic scrolling to latest messages with timeout protection
- **Modern Stack**: React + TypeScript, TailwindCSS, FastAPI, Zustand state management

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
- **React Syntax Highlighter** for code display
- **Server-Sent Events** for real-time streaming
- **Blob API** for file downloads

### Backend
- **FastAPI** with Python 3.12+
- **Gemini 2.5 Flash** (free tier)
- **LangGraph** for conversation memory and state management
- **Server-Sent Events** streaming responses
- **Pydantic** for data validation
- **CORS** enabled for cross-origin requests

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (we're using 20.19.2)
- Python 3.12+ (we're using 3.12.6)
- Gemini API key

### Setup

1. **Clone and navigate to project**
   ```bash
   cd code-generate-bot
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```bash
   # backend/.env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

**Quick Start (Recommended):**
```bash
# From the root directory, use the provided scripts:
./start_backend.sh   # Terminal 1
./start_frontend.sh  # Terminal 2
```

**Manual Start:**
1. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
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

✅ **Completed Features:**
- Full-stack application with React frontend and FastAPI backend
- Real-time streaming chat with Server-Sent Events
- Artifact sidebar with syntax highlighting and proper scrolling
- Conversation memory using LangGraph for context persistence
- Auto-scroll chat functionality with timeout protection
- Download system for individual and bulk artifacts
- Proper error handling and loading states
- CORS configuration for cross-origin requests
- Git repository setup with proper .gitignore files

## 🔧 How We Approached the Problem

### 1. **Architecture Design**
- **Frontend-Backend Separation**: Clean separation with FastAPI serving API and React handling UI
- **State Management**: Zustand for predictable state updates and real-time UI synchronization
- **Streaming Strategy**: Server-Sent Events for real-time response streaming without WebSocket complexity

### 2. **UI/UX Problem Solving**
- **Artifact Sidebar Scrolling**: Fixed nested overflow issues with proper flex layout and overflow-auto containers
- **Chat Auto-scroll**: Implemented useRef-based scrolling with timeout protection to prevent stuck states
- **Sending State Management**: Immediate UI feedback by setting streaming state before API calls

### 3. **Backend Integration**
- **Memory Management**: LangGraph integration for conversation persistence across requests
- **Streaming Implementation**: Chunked response streaming with proper error handling and cleanup
- **API Design**: RESTful endpoints with clear separation of concerns

### 4. **Development Workflow**
- **Incremental Development**: Built features iteratively, testing each component before integration
- **Error-Driven Development**: Identified and fixed issues through systematic debugging
- **User-Centric Fixes**: Addressed specific UI problems like scroll behavior and loading states

### 5. **Feature Enhancement Process**
1. **Problem Identification**: User reported specific issues (scrolling, auto-scroll, download needs)
2. **Root Cause Analysis**: Investigated technical causes (overflow conflicts, state management)
3. **Solution Implementation**: Applied targeted fixes with proper testing
4. **User Experience Polish**: Added icons, tooltips, and visual feedback

## 📝 API Endpoints

- `GET /` - Health check and API status
- `GET /health` - Detailed backend health information
- `POST /chat/stream` - Streaming chat endpoint with conversation memory
- **Conversation Management**: Automatic conversation ID handling and message persistence

## 🔧 Development

### Project Architecture
The application follows a clean separation of concerns:

**Frontend (React + TypeScript)**
- `src/components/`: UI components (Chat.tsx, ArtifactSidebar.tsx)
- `src/store/`: Zustand state management (chatStore.ts)
- `src/services/`: API integration (chatApi.ts)
- Real-time updates with Server-Sent Events
- Responsive design with TailwindCSS

**Backend (FastAPI + Python)**
- `app/routers/`: API route handlers (chat.py)
- `app/services/`: Business logic (gemini_service.py, memory_service.py)
- `app/models/`: Data schemas (schemas.py)
- LangGraph for conversation memory
- Streaming responses with proper error handling

### Development Features
- **Hot Reload**: Both frontend and backend support live reloading
- **Type Safety**: Full TypeScript integration with proper type definitions
- **Error Handling**: Comprehensive error handling at API and UI levels
- **Git Integration**: Proper version control with multi-environment .gitignore setup
- **Debugging**: Console logging for streaming events and state changes

### Key Implementation Details
- **Streaming**: Server-Sent Events with chunked JSON responses
- **Memory**: LangGraph-based conversation persistence with automatic cleanup
- **UI State**: Zustand store for real-time UI updates and artifact management
- **File Downloads**: Blob API integration with proper MIME type handling
- **Auto-scroll**: Ref-based scroll management with timeout protection

## 🚀 Next Steps & Potential Enhancements

### Immediate Improvements
- **Database Integration**: Add PostgreSQL/SQLite for persistent conversation history
- **User Authentication**: Implement user sessions and conversation ownership
- **Enhanced Downloads**: ZIP file support for multi-file artifact downloads
- **Code Execution**: Safe code execution environment for testing generated code

### Advanced Features
- **File Upload**: Support for code file uploads and analysis
- **Project Templates**: Pre-built project scaffolding templates
- **Collaborative Features**: Multiple users working on the same conversation
- **Export Options**: PDF/Markdown export of conversations with artifacts

Ready for production deployment and further feature development!
