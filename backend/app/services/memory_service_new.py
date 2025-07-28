from typing import Dict, List, Any
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI
import uuid
import os


class ConversationMemory:
    """Simple conversation memory system for short-term memory"""

    def __init__(self):
        self.conversations: Dict[str, List[BaseMessage]] = {}

        # Initialize the LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.7,
            max_tokens=4096,
        )

    def get_conversation_history(self, conversation_id: str) -> List[BaseMessage]:
        """Get conversation history for a specific conversation"""
        return self.conversations.get(conversation_id, [])

    def add_message(self, conversation_id: str, message: BaseMessage):
        """Add a message to conversation history"""
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        self.conversations[conversation_id].append(message)

    def clear_conversation(self, conversation_id: str) -> None:
        """Clear conversation history for a specific conversation"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]

    def list_conversations(self) -> List[str]:
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
        history = self.get_conversation_history(conversation_id)

        # Prepare messages for context
        context_messages = []

        # Add recent history (last 10 messages for context)
        recent_history = history[-10:] if len(history) > 10 else history
        context_messages.extend(recent_history)

        # Add current message
        context_messages.append(human_message)

        # Create enhanced prompt
        system_message = HumanMessage(
            content=(
                "You are an expert AI coding assistant. When generating code, always wrap code in proper"
                " markdown code blocks with language specification. For web development, create complete,"
                " functional examples. Include HTML, CSS, and JavaScript when creating web interfaces. "
                "Make code practical and immediately usable. Always explain what the code does."
            )
        )

        # Insert system message at the beginning
        all_messages = [system_message] + context_messages

        # Get response from LLM
        response = await self.llm.ainvoke(all_messages)

        # Store messages in conversation history
        self.add_message(conversation_id, human_message)
        self.add_message(conversation_id, response)

        return {
            "response": response.content,
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
        history = self.get_conversation_history(conversation_id)

        # Prepare messages for context
        context_messages = []

        # Add recent history (last 6 messages for context)
        recent_history = history[-6:] if len(history) > 6 else history
        context_messages.extend(recent_history)

        # Add current message
        context_messages.append(human_message)

        # Create enhanced prompt
        system_message = HumanMessage(
            content=(
                "You are an expert AI coding assistant. When generating code, always wrap code "
                "in proper markdown code blocks with language specification. For web development, "
                "create complete, functional examples. Include HTML, CSS, and JavaScript when creating "
                "web interfaces. Make code practical and immediately usable. Always explain what the code does."
                )
        )

        # Insert system message at the beginning
        all_messages = [system_message] + context_messages

        # Stream response from LLM
        full_response = ""
        try:
            async for chunk in self.llm.astream(all_messages):
                if hasattr(chunk, 'content') and chunk.content:
                    full_response += chunk.content
                    yield {
                        'type': 'content',
                        'content': chunk.content
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

    # Async versions of sync methods for router compatibility
    async def get_conversation_history(self, conversation_id: str) -> List[BaseMessage]:
        """Async version of get_conversation_history"""
        return self.conversations.get(conversation_id, [])

    async def clear_conversation(self, conversation_id: str) -> None:
        """Async version of clear_conversation"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]

    async def list_conversations(self) -> List[str]:
        """Async version of list_conversations"""
        return list(self.conversations.keys())


# Global memory instance
conversation_memory = ConversationMemory()
