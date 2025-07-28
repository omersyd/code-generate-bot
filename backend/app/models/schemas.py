from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime


class ChatMessage(BaseModel):
    id: str
    content: str
    role: str  # "user" or "assistant"
    timestamp: datetime
    artifacts: Optional[List[Dict[str, Any]]] = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    id: str
    content: str
    role: str
    timestamp: datetime
    conversation_id: str
    artifacts: Optional[List[Dict[str, Any]]] = None


class StreamResponse(BaseModel):
    type: str  # "text", "artifact", "end"
    content: str
    conversation_id: str
    message_id: Optional[str] = None


class CodeArtifact(BaseModel):
    id: str
    title: str
    language: str
    code: str
    description: Optional[str] = None
    created_at: datetime
