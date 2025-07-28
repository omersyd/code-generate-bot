import { create } from 'zustand';
import type { ChatMessage, Artifact } from '../services/chatApi';

interface ChatState {
  // Current conversation
  messages: ChatMessage[];
  currentConversationId: string | null;

  // Streaming state
  isStreaming: boolean;
  currentStreamingMessage: string;
  currentStreamingMessageId: string | null;
  pendingArtifacts: Artifact[];

  // Artifacts
  artifacts: Artifact[];
  selectedArtifact: Artifact | null;

  // UI state
  inputMessage: string;
  isRightSidebarOpen: boolean;
  currentViewMode: 'code' | 'preview';

  // Edit state
  editingMessageId: string | null;
  editingContent: string;

  // Actions
  setInputMessage: (message: string) => void;
  startStreaming: (messageId: string, conversationId: string) => void;
  addStreamChunk: (chunk: string) => void;
  completeStreaming: () => void;
  addUserMessage: (content: string) => void;
  addAiMessage: (content: string, artifacts?: Artifact[]) => void;
  setArtifacts: (artifacts: Artifact[]) => void;
  selectArtifact: (artifact: Artifact | null) => void;
  toggleRightSidebar: () => void;
  setViewMode: (mode: 'code' | 'preview') => void;
  clearChat: () => void;

  // New actions for resend/edit
  resendMessage: (messageId: string) => void;
  startEditingMessage: (messageId: string, content: string) => void;
  cancelEditing: () => void;
  saveEditedMessage: (messageId: string, newContent: string) => void;
  setEditingContent: (content: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  currentConversationId: null,
  isStreaming: false,
  currentStreamingMessage: '',
  currentStreamingMessageId: null,
  pendingArtifacts: [],
  artifacts: [],
  selectedArtifact: null,
  inputMessage: '',
  isRightSidebarOpen: false,
  currentViewMode: 'code',
  editingMessageId: null,
  editingContent: '',

  // Actions
  setInputMessage: (message: string) =>
    set({ inputMessage: message }),

  startStreaming: (messageId: string, conversationId: string) =>
    set({
      isStreaming: true,
      currentStreamingMessage: '',
      currentStreamingMessageId: messageId,
      currentConversationId: conversationId,
      pendingArtifacts: [],
    }),

  addStreamChunk: (chunk: string) =>
    set((state) => ({
      currentStreamingMessage: state.currentStreamingMessage + chunk
    })),

  completeStreaming: () => {
    const { currentStreamingMessage, currentStreamingMessageId, messages, pendingArtifacts } = get();

    if (currentStreamingMessageId && currentStreamingMessage) {
      const newMessage: ChatMessage = {
        id: currentStreamingMessageId,
        content: currentStreamingMessage,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        artifacts: pendingArtifacts.length > 0 ? pendingArtifacts : undefined,
      };

      set({
        messages: [...messages, newMessage],
        isStreaming: false,
        currentStreamingMessage: '',
        currentStreamingMessageId: null,
        pendingArtifacts: [],
      });
    } else {
      set({
        isStreaming: false,
        currentStreamingMessage: '',
        currentStreamingMessageId: null,
        pendingArtifacts: [],
      });
    }
  },

  addUserMessage: (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
    }));
  },

  addAiMessage: (content: string, artifacts?: Artifact[]) => {
    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      artifacts,
    };

    set((state) => ({
      messages: [...state.messages, aiMessage],
    }));
  },

  setArtifacts: (artifacts: Artifact[]) => {
    set((state) => {
      const newArtifacts = [...state.artifacts, ...artifacts];
      const newPendingArtifacts = [...state.pendingArtifacts, ...artifacts];

      return {
        artifacts: newArtifacts,
        pendingArtifacts: newPendingArtifacts,
        isRightSidebarOpen: artifacts.length > 0 ? true : state.isRightSidebarOpen,
        selectedArtifact: artifacts.length > 0 ? artifacts[0] : state.selectedArtifact,
      };
    });
  },

  selectArtifact: (artifact: Artifact | null) =>
    set({ selectedArtifact: artifact }),

  toggleRightSidebar: () =>
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),

  setViewMode: (mode: 'code' | 'preview') =>
    set({ currentViewMode: mode }),

  clearChat: () =>
    set({
      messages: [],
      currentConversationId: null,
      isStreaming: false,
      currentStreamingMessage: '',
      currentStreamingMessageId: null,
      pendingArtifacts: [],
      artifacts: [],
      selectedArtifact: null,
      inputMessage: '',
      isRightSidebarOpen: false,
      currentViewMode: 'code',
      editingMessageId: null,
      editingContent: '',
    }),

  // New actions for resend/edit functionality
  resendMessage: (messageId: string) => {
    const state = get();
    const message = state.messages.find(m => m.id === messageId);
    if (message && message.role === 'user') {
      // Simply put the message content back in input field for resending
      // Don't remove any messages - just append when user sends
      set({
        inputMessage: message.content,
      });
    }
  },

  startEditingMessage: (messageId: string, content: string) => {
    set({
      editingMessageId: messageId,
      editingContent: content,
    });
  },

  cancelEditing: () => {
    set({
      editingMessageId: null,
      editingContent: '',
    });
  },

  saveEditedMessage: (_messageId: string, newContent: string) => {
    // Simply put the edited content in input field for sending as new message
    // Don't modify existing messages - just append the edited version
    // Note: messageId is kept for interface compatibility but not used
    set({
      editingMessageId: null,
      editingContent: '',
      inputMessage: newContent,
    });
  },

  setEditingContent: (content: string) => {
    set({ editingContent: content });
  },
}));
