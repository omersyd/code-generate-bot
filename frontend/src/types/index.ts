export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  artifacts?: CodeArtifact[];
}

export interface CodeArtifact {
  id: string;
  title: string;
  language: string;
  code: string;
  description?: string;
  created_at: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ArtifactState {
  currentArtifact: CodeArtifact | null;
  isVisible: boolean;
  viewMode: 'code' | 'preview';
}
