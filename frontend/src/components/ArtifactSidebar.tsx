import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChatStore } from '../store/chatStore';
import type { Artifact } from '../services/chatApi';

const ArtifactSidebar: React.FC = () => {
  const {
    artifacts,
    selectedArtifact,
    isRightSidebarOpen,
    currentViewMode,
    selectArtifact,
    toggleRightSidebar,
    setViewMode,
  } = useChatStore();

  if (!isRightSidebarOpen || artifacts.length === 0) {
    return null;
  }

  // Function to download artifact as a file
  const downloadArtifact = (artifact: Artifact) => {
    const fileExtension = getFileExtension(artifact.language);
    const fileName = `${artifact.title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;

    const blob = new Blob([artifact.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Function to download all artifacts as a ZIP file
  const downloadAllArtifacts = async () => {
    // We'll use a simple approach - create a text file with all artifacts
    let allContent = '';

    artifacts.forEach((artifact, index) => {
      const separator = index > 0 ? '\n\n' + '='.repeat(80) + '\n\n' : '';
      allContent += `${separator}// File: ${artifact.title}.${getFileExtension(artifact.language)}\n`;
      allContent += `// Language: ${artifact.language}\n`;
      allContent += `// Description: ${artifact.description}\n\n`;
      allContent += artifact.code;
    });

    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `artifacts_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-1/2 border-l bg-white flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">Code Artifacts</h2>
          {artifacts.length > 1 && (
            <button
              onClick={() => downloadAllArtifacts()}
              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Download All
            </button>
          )}
        </div>
        <button
          onClick={toggleRightSidebar}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Artifact List */}
      <div className="border-b max-h-48 overflow-y-auto flex-shrink-0">
        {artifacts.map((artifact) => (
          <button
            key={artifact.id}
            onClick={() => selectArtifact(artifact)}
            className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
              selectedArtifact?.id === artifact.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="font-medium">{artifact.title}</div>
            <div className="text-sm text-gray-500">{artifact.language}</div>
            <div className="text-xs text-gray-400 mt-1">{artifact.description}</div>
          </button>
        ))}
      </div>

      {/* Code Display */}
      {selectedArtifact && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b bg-gray-50 flex-shrink-0">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-medium">{selectedArtifact.title}</h3>
                <div className="text-sm text-gray-600">{selectedArtifact.language}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedArtifact.code);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded flex items-center space-x-1"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => downloadArtifact(selectedArtifact)}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center space-x-1"
                  title="Download as file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code/Preview Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 text-sm rounded ${
                  currentViewMode === 'code'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-sm rounded ${
                  currentViewMode === 'preview'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={!canPreview(selectedArtifact)}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Content Display */}
          <div className="flex-1 overflow-hidden">
            {currentViewMode === 'code' ? (
              <div className="h-full p-0 overflow-auto">
                <SyntaxHighlighter
                  language={getLanguageForHighlighter(selectedArtifact.language)}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '14px',
                    background: 'transparent',
                    minHeight: '100%',
                  }}
                  wrapLongLines={true}
                  showLineNumbers={true}
                >
                  {selectedArtifact.code}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                {renderPreview(selectedArtifact)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to map language names to syntax highlighter languages
const getLanguageForHighlighter = (language: string): string => {
  const langMap: Record<string, string> = {
    'python': 'python',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'sql': 'sql',
    'bash': 'bash',
    'shell': 'bash',
    'yaml': 'yaml',
    'xml': 'xml',
    'markdown': 'markdown',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'csharp': 'csharp',
    'php': 'php',
    'ruby': 'ruby',
    'go': 'go',
    'rust': 'rust',
    'elixir': 'elixir',
    'swift': 'swift',
    'kotlin': 'kotlin',
  };

  const lang = language.toLowerCase();
  return langMap[lang] || 'text';
};

// Helper function to map language names to file extensions
const getFileExtension = (language: string): string => {
  const extMap: Record<string, string> = {
    'python': 'py',
    'javascript': 'js',
    'typescript': 'ts',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'sql': 'sql',
    'bash': 'sh',
    'shell': 'sh',
    'yaml': 'yml',
    'xml': 'xml',
    'markdown': 'md',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'csharp': 'cs',
    'php': 'php',
    'ruby': 'rb',
    'go': 'go',
    'rust': 'rs',
    'elixir': 'ex',
    'swift': 'swift',
    'kotlin': 'kt',
  };

  const lang = language.toLowerCase();
  return extMap[lang] || 'txt';
};

// Helper function to check if artifact can be previewed
const canPreview = (artifact: Artifact) => {
  const previewableLanguages = ['html', 'javascript', 'css', 'jsx', 'tsx'];
  return previewableLanguages.includes(artifact.language.toLowerCase());
};

// Helper function to render preview
const renderPreview = (artifact: Artifact) => {
  const lang = artifact.language.toLowerCase();

  if (lang === 'html') {
    return (
      <iframe
        srcDoc={artifact.code}
        className="w-full h-full border-0"
        sandbox="allow-scripts"
        title="HTML Preview"
      />
    );
  }

  if (lang === 'javascript' || lang === 'jsx' || lang === 'tsx') {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="bg-yellow-100 border border-yellow-300 rounded p-3 m-4 mb-2 flex-shrink-0">
          <p className="text-sm text-yellow-800">
            <strong>JavaScript Preview:</strong> This is React/JS code that would need to be executed in a proper environment.
          </p>
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4">
          <SyntaxHighlighter
            language={getLanguageForHighlighter(artifact.language)}
            style={vscDarkPlus}
            customStyle={{
              fontSize: '12px',
              borderRadius: '4px',
              background: 'transparent',
              margin: 0,
            }}
            wrapLongLines={true}
            showLineNumbers={true}
          >
            {artifact.code}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  if (lang === 'css') {
    const htmlWithCSS = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${artifact.code}</style>
        </head>
        <body>
          <div class="demo-content">
            <h1>CSS Preview</h1>
            <p>This shows how your CSS styles would look.</p>
            <button>Sample Button</button>
            <div class="sample-box">Sample Box</div>
          </div>
        </body>
      </html>
    `;

    return (
      <iframe
        srcDoc={htmlWithCSS}
        className="w-full h-full border-0"
        title="CSS Preview"
      />
    );
  }

  return (
    <div className="p-4 h-full bg-gray-50 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <p>Preview not available for {artifact.language}</p>
        <p className="text-sm">Switch to Code view to see the content</p>
      </div>
    </div>
  );
};

export default ArtifactSidebar;
