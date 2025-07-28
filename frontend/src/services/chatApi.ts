export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  artifacts?: Artifact[];
}

export interface Artifact {
  id: string;
  title: string;
  language: string;
  code: string;
  description: string;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface StreamEvent {
  type: 'user_message' | 'ai_start' | 'ai_chunk' | 'artifacts' | 'ai_complete' | 'error';
  content?: string;
  message_id?: string;
  conversation_id?: string;
  artifacts?: Artifact[];
  error?: string;
}

export class ChatApi {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000/api/chat') {
    this.baseUrl = baseUrl;
  }

  // Regular chat endpoint
  async sendMessage(request: ChatRequest): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // SSE streaming endpoint
  streamMessage(
    request: ChatRequest,
    onEvent: (event: StreamEvent) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): () => void {
    // Use fetch with streaming instead of EventSource (which doesn't support POST)
    this.fetchStream(request, onEvent, onError, onComplete);

    return () => {
      // Return cleanup function (could add AbortController here)
    };
  }

  private async fetchStream(
    request: ChatRequest,
    onEvent: (event: StreamEvent) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      console.log('Starting stream request:', request);
      const response = await fetch(`${this.baseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      console.log('Starting to read stream...');
      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        chunkCount++;

        console.log(`Chunk ${chunkCount}: done=${done}, value length=${value?.length || 0}`);

        if (done) {
          console.log('Stream done, calling onComplete');
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6); // Remove 'data: ' prefix
              if (data.trim()) {
                const event: StreamEvent = JSON.parse(data);
                console.log('Parsed event:', event);
                onEvent(event);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, 'Line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('fetchStream error:', error);
      onError(error as Error);
    }
  }

  // Get conversation history
  async getConversation(conversationId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseUrl}/history/${conversationId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const chatApi = new ChatApi();
