from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse, ChatMessage
from app.services.gemini_service import gemini_service
from datetime import datetime
import uuid
import json

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """Send a message and get AI response using memory system"""
    try:
        # Generate conversation ID if not provided
        conversation_id = request.conversation_id or str(uuid.uuid4())

        # Generate response with memory
        result = await gemini_service.generate_response_with_memory(
            request.message,
            conversation_id
        )

        # Create response message
        ai_message = ChatMessage(
            id=str(uuid.uuid4()),
            content=result['response'],
            role="assistant",
            timestamp=datetime.now(),
            artifacts=result['artifacts'] if result['artifacts'] else None
        )

        # Return response
        return ChatResponse(
            id=ai_message.id,
            content=ai_message.content,
            role=ai_message.role,
            timestamp=ai_message.timestamp,
            conversation_id=result['conversation_id'],
            artifacts=ai_message.artifacts
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )


@router.post("/stream")
async def stream_message(request: ChatRequest):
    """Send a message and get streaming AI response using memory system"""
    async def generate():
        try:
            # Generate conversation ID if not provided
            conversation_id = request.conversation_id or str(uuid.uuid4())

            # Send user message confirmation
            user_data = {
                'type': 'user_message',
                'content': request.message,
                'conversation_id': conversation_id
            }
            yield f"data: {json.dumps(user_data)}\n\n"

            # Start AI response
            ai_message_id = str(uuid.uuid4())

            ai_start_data = {
                'type': 'ai_start',
                'message_id': ai_message_id,
                'conversation_id': conversation_id
            }
            yield f"data: {json.dumps(ai_start_data)}\n\n"

            # Stream AI response using memory
            async for chunk in gemini_service.stream_response_with_memory(
                request.message,
                conversation_id
            ):
                if chunk['type'] == 'content':
                    chunk_data = {
                        'type': 'ai_chunk',
                        'content': chunk['content'],
                        'message_id': ai_message_id
                    }
                    yield f"data: {json.dumps(chunk_data)}\n\n"

                elif chunk['type'] == 'complete':
                    # Send artifacts if any
                    if chunk['artifacts']:
                        artifacts_data = {
                            'type': 'artifacts',
                            'artifacts': chunk['artifacts'],
                            'message_id': ai_message_id
                        }
                        yield f"data: {json.dumps(artifacts_data)}\n\n"

                    # Send completion
                    complete_data = {
                        'type': 'ai_complete',
                        'message_id': ai_message_id,
                        'conversation_id': chunk['conversation_id']
                    }
                    yield f"data: {json.dumps(complete_data)}\n\n"

                elif chunk['type'] == 'error':
                    error_data = {
                        'type': 'error',
                        'error': chunk['content'],
                        'message_id': ai_message_id
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )


@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation history from memory system"""
    try:
        from app.services.memory_service import conversation_memory

        # Get conversation history from memory
        history = await conversation_memory.get_conversation_history(
            conversation_id
        )

        if not history:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )

        # Convert to chat messages format
        messages = []
        for msg in history:
            message = {
                "id": str(uuid.uuid4()),
                "content": msg.content,
                "role": "user" if msg.type == "human" else "assistant",
                "timestamp": datetime.now().isoformat(),
                "artifacts": None
            }
            messages.append(message)

        return {
            "conversation_id": conversation_id,
            "messages": messages
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving conversation: {str(e)}"
        )


@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation from memory system"""
    try:
        from app.services.memory_service import conversation_memory

        # Clear conversation from memory
        await conversation_memory.clear_conversation(conversation_id)

        return {"message": "Conversation deleted successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting conversation: {str(e)}"
        )


@router.get("/conversations")
async def list_conversations():
    """List all conversation IDs from memory system"""
    try:
        from app.services.memory_service import conversation_memory

        # Get all conversation IDs from memory
        conversation_ids = await conversation_memory.list_conversations()

        conversations_list = []
        for conv_id in conversation_ids:
            history = await conversation_memory.get_conversation_history(
                conv_id
            )
            conversations_list.append({
                "id": conv_id,
                "message_count": len(history) if history else 0,
                "last_updated": datetime.now().isoformat()
            })

        return {"conversations": conversations_list}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing conversations: {str(e)}"
        )
