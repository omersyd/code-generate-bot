import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { chatApi } from '../services/chatApi';
import type { StreamEvent } from '../services/chatApi';

const Chat: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    messages,
    inputMessage,
    isStreaming,
    currentStreamingMessage,
    currentConversationId,
    setInputMessage,
    addUserMessage,
    startStreaming,
    addStreamChunk,
    completeStreaming,
    setArtifacts,
    toggleRightSidebar,
  } = useChatStore();

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, []);

  // Instant scroll to bottom (for real-time streaming)
  const scrollToBottomInstant = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    setShowScrollButton(false);
  }, []);

  // Check if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    setShowScrollButton(!isAtBottom);
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-scroll during streaming (more frequent, instant)
  useEffect(() => {
    if (isStreaming && currentStreamingMessage) {
      scrollToBottomInstant();
    }
  }, [currentStreamingMessage, isStreaming, scrollToBottomInstant]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isStreaming) return;

    console.log('handleSendMessage called, isStreaming:', isStreaming);

    // Add user message to store
    addUserMessage(inputMessage);
    const userMessage = inputMessage;
    setInputMessage('');

    // Set streaming state immediately to show "Sending..." button
    startStreaming('temp-id', 'temp-conversation-id');

    // Set up a timeout to prevent getting stuck in streaming state
    const streamTimeout = setTimeout(() => {
      console.log('Stream timeout - forcing completion after 30 seconds');
      completeStreaming();
    }, 30000); // 30 second timeout

    // Start streaming
    try {
      console.log('Starting stream with message:', userMessage);
      const cleanup = chatApi.streamMessage(
        {
          message: userMessage,
          conversation_id: currentConversationId || undefined
        },
        (event: StreamEvent) => {
          console.log('Received stream event:', event);
          switch (event.type) {
            case 'ai_start':
              if (event.message_id && event.conversation_id) {
                // Update streaming state with real IDs from backend
                startStreaming(event.message_id, event.conversation_id);
              }
              break;
            case 'ai_chunk':
              if (event.content) {
                addStreamChunk(event.content);
              }
              break;
            case 'artifacts':
              if (event.artifacts) {
                setArtifacts(event.artifacts);
              }
              break;
            case 'ai_complete':
              console.log('Completing streaming...');
              clearTimeout(streamTimeout);
              completeStreaming();
              break;
            case 'error':
              console.error('Stream error:', event.error);
              clearTimeout(streamTimeout);
              completeStreaming();
              break;
          }
        },
        (error) => {
          console.error('Stream error:', error);
          clearTimeout(streamTimeout);
          completeStreaming();
        },
        () => {
          console.log('Stream completed callback');
          clearTimeout(streamTimeout);
          // Always force completion on stream end to be safe
          console.log('Forcing completion due to stream end');
          completeStreaming();
        }
      );

      // Cleanup function can be used for abort functionality
      return cleanup;
    } catch (error) {
      console.error('Error starting stream:', error);
      clearTimeout(streamTimeout);
      completeStreaming();
    }
  }, [inputMessage, isStreaming, currentConversationId, addUserMessage, setInputMessage, startStreaming, addStreamChunk, completeStreaming, setArtifacts]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.artifacts && message.artifacts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={toggleRightSidebar}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    View Generated Artifact{message.artifacts.length > 1 ? 's' : ''}
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.artifacts.length} artifact(s) generated
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {isStreaming && currentStreamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-900">
              <div className="whitespace-pre-wrap">{currentStreamingMessage}</div>
              <div className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
            </div>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors z-10"
          aria-label="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={isStreaming}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
