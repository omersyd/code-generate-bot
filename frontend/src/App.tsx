import Chat from './components/Chat';
import ArtifactSidebar from './components/ArtifactSidebar';
import { useChatStore } from './store/chatStore';
import './App.css';

function App() {
  const { clearChat, artifacts } = useChatStore();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Code Assist</h1>
        <div className="flex space-x-2">
          {artifacts.length > 0 && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-2 rounded">
              {artifacts.length} Artifact(s)
            </span>
          )}
          <button
            onClick={clearChat}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Clear Chat
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <Chat />
        </div>

        {/* Artifact Sidebar */}
        <ArtifactSidebar />
      </main>
    </div>
  );
}

export default App;
