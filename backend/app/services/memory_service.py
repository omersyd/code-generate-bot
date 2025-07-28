from typing import Dict, List, Any
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
import google.generativeai as genai
import uuid
import os
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()


class ConversationMemory:
    """Simple conversation memory system for short-term memory"""

    def __init__(self):
        self.conversations: Dict[str, List[BaseMessage]] = {}

        # Initialize Gemini directly
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

    async def get_conversation_history(
        self, conversation_id: str
    ) -> List[BaseMessage]:
        """Get conversation history for a specific conversation"""
        return self.conversations.get(conversation_id, [])

    def add_message(self, conversation_id: str, message: BaseMessage):
        """Add a message to conversation history"""
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        self.conversations[conversation_id].append(message)

    async def clear_conversation(self, conversation_id: str) -> None:
        """Clear conversation history for a specific conversation"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]

    async def list_conversations(self) -> List[str]:
        """List all conversation IDs"""
        return list(self.conversations.keys())

    async def ainvoke_with_memory(
        self, message: str, conversation_id: str = None
    ) -> Dict[str, Any]:
        """Async invoke with memory"""
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        # Create human message
        human_message = HumanMessage(content=message)

        # Get conversation history
        history = await self.get_conversation_history(conversation_id)

        # Build context from history
        context_parts = []

        # Add recent history (last 10 messages for context)
        recent_history = history[-10:] if len(history) > 10 else history
        for msg in recent_history:
            if isinstance(msg, HumanMessage):
                context_parts.append(f"User: {msg.content}")
            elif isinstance(msg, AIMessage):
                context_parts.append(f"Assistant: {msg.content}")

        # Create enhanced prompt with context
        system_prompt = (
            "You are an expert AI coding assistant. When generating code, "
            "always wrap code in proper markdown code blocks with language "
            "specification. For web development, create complete, functional "
            "examples. Include HTML, CSS, and JavaScript when creating web "
            "interfaces. Make code practical and immediately usable. Always "
            "explain what the code does."
        )

        full_prompt = system_prompt
        if context_parts:
            context_str = "\n".join(context_parts)
            full_prompt += f"\n\nConversation history:\n{context_str}"
        full_prompt += f"\n\nUser: {message}"

        # Get response from Gemini
        response = self.model.generate_content(full_prompt)
        response_text = response.text

        # Store messages in conversation history
        self.add_message(conversation_id, human_message)
        ai_message = AIMessage(content=response_text)
        self.add_message(conversation_id, ai_message)

        return {
            "response": response_text,
            "conversation_id": conversation_id,
            "message_count": len(self.conversations.get(conversation_id, [])),
        }

    async def astream_with_memory(
        self, message: str, conversation_id: str = None
    ):
        """Async streaming with memory"""
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        # Create human message
        human_message = HumanMessage(content=message)

        # Get conversation history
        history = await self.get_conversation_history(conversation_id)

        # Build context from history
        context_parts = []

        # Add recent history (last 6 messages for context)
        recent_history = history[-6:] if len(history) > 6 else history
        for msg in recent_history:
            if isinstance(msg, HumanMessage):
                context_parts.append(f"User: {msg.content}")
            elif isinstance(msg, AIMessage):
                context_parts.append(f"Assistant: {msg.content}")

        # Create enhanced prompt with context
        system_prompt = (
            "You are an expert AI coding assistant. When generating code, "
            "always wrap code in proper markdown code blocks with language "
            "specification. For web development, create complete, functional "
            "examples. Include HTML, CSS, and JavaScript when creating web "
            "interfaces. Make code practical and immediately usable. Always "
            "explain what the code does."
        )

        full_prompt = system_prompt
        if context_parts:
            context_str = "\n".join(context_parts)
            full_prompt += f"\n\nConversation history:\n{context_str}"
        full_prompt += f"\n\nUser: {message}"

        # Stream response from Gemini
        full_response = ""
        try:
            response = self.model.generate_content(full_prompt, stream=True)

            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    yield {
                        'type': 'content',
                        'content': chunk.text
                    }

            # Store messages in conversation history
            self.add_message(conversation_id, human_message)
            ai_message = AIMessage(content=full_response)
            self.add_message(conversation_id, ai_message)

            # Send completion signal
            yield {
                'type': 'complete',
                'full_response': full_response,
                'conversation_id': conversation_id
            }

        except Exception as e:
            yield {
                'type': 'error',
                'content': f"Error in streaming response: {str(e)}"
            }


# Global memory instance
conversation_memory = ConversationMemory()
