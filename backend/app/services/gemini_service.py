import google.generativeai as genai
import os
import re
from typing import AsyncGenerator, Dict
from dotenv import load_dotenv
from .memory_service import conversation_memory

# Ensure environment variables are loaded
load_dotenv()


class GeminiService:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

    async def generate_response(self, message: str) -> str:
        try:
            response = self.model.generate_content(message)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"

    async def stream_response(self, message: str) -> AsyncGenerator[str, None]:
        try:
            response = self.model.generate_content(message, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error streaming response: {str(e)}"

    def extract_code_blocks(self, text: str) -> list:
        pattern = r'```(\w+)?\n(.*?)```'
        matches = re.findall(pattern, text, re.DOTALL)

        code_blocks = []
        for match in matches:
            language = match[0] if match[0] else 'text'
            code = match[1].strip()
            code_blocks.append({
                'language': language,
                'code': code
            })

        return code_blocks

    def detect_artifact_type(self, code: str, language: str) -> str:
        code_lower = code.lower()

        # First, trust the explicitly declared language if it's a known type
        if language:
            language_lower = language.lower()
            if language_lower in ['python', 'py']:
                return 'python'
            elif language_lower in ['javascript', 'js']:
                return 'javascript'
            elif language_lower in ['html']:
                return 'html'
            elif language_lower in ['css']:
                return 'css'
            elif language_lower in ['typescript', 'ts']:
                return 'typescript'
            elif language_lower in ['java']:
                return 'java'
            elif language_lower in ['cpp', 'c++']:
                return 'cpp'
            elif language_lower in ['c']:
                return 'c'
            elif language_lower in ['go', 'golang']:
                return 'go'
            elif language_lower in ['rust', 'rs']:
                return 'rust'
            elif language_lower in ['elixir', 'ex', 'exs']:
                return 'elixir'

        # Fallback to content-based detection if language is not specified or unknown
        if any(tag in code_lower for tag in ['<html', '<body', '<div', '<head']):
            return 'html'

        if (
            '{' in code
            and '}' in code
            and any(
                prop in code_lower
                for prop in [
                    'color:',
                    'background:',
                    'margin:',
                    'padding:'
                ]
            )
        ):
            return 'css'

        # Python detection - check for Python-specific keywords
        if any(keyword in code_lower for keyword in [
            'def ', 'import ', 'print(', 'class ', 'if __name__', 'from ', '# python'
        ]):
            return 'python'

        # Go detection - check for Go-specific keywords
        if any(keyword in code_lower for keyword in [
            'package ', 'func ', 'import ', 'var ', 'go ', 'defer ', 'chan ', 'goroutine'
        ]):
            return 'go'

        # Rust detection - check for Rust-specific keywords
        if any(keyword in code_lower for keyword in [
            'fn ', 'let ', 'mut ', 'struct ', 'impl ', 'use ', 'extern crate', '&str'
        ]):
            return 'rust'

        # Elixir detection - check for Elixir-specific keywords
        if any(keyword in code_lower for keyword in [
            'defmodule ', 'def ', 'defp ', 'end', 'do:', '|>', 'spawn', 'receive'
        ]):
            return 'elixir'

        # JavaScript detection - only if not already detected as other languages
        if any(keyword in code_lower for keyword in [
            'function', 'const ', 'let ', 'var ', 'document.', 'console.log'
        ]):
            return 'javascript'

        if (
            'html' in code_lower
            and ('css' in code_lower or 'style' in code_lower)
            and ('script' in code_lower or 'javascript' in code_lower)
        ):
            return 'webapp'

        return language or 'code'

    async def generate_enhanced_response(self, message: str) -> Dict:
        system_prompt = (
            "You are an expert AI coding assistant. When generating code, always wrap code in proper "
            "markdown code blocks with language specification. For web development, create complete, "
            "functional examples. Include HTML, CSS, and JavaScript when creating web interfaces. "
            "Make code practical and immediately usable. Always explain what the code does."
        )
        enhanced_message = f"{system_prompt}\n\nUser request: {message}"

        try:
            response = self.model.generate_content(enhanced_message)
            response_text = response.text

            code_blocks = self.extract_code_blocks(response_text)
            artifacts = []

            for i, block in enumerate(code_blocks):
                artifact_type = self.detect_artifact_type(block['code'], block['language'])

                artifacts.append({
                    'id': f"artifact_{i}_{hash(block['code']) % 1000}",
                    'type': artifact_type,
                    'language': block['language'],
                    'code': block['code'],
                    'title': f"{artifact_type.capitalize()} Code"
                })

            return {
                'response': response_text,
                'artifacts': artifacts
            }

        except Exception as e:
            return {
                'response': f"Error generating response: {str(e)}",
                'artifacts': []
            }

    async def stream_enhanced_response(self, message: str) -> AsyncGenerator[Dict, None]:
        system_prompt = (
            "You are an expert AI coding assistant. When generating code, always wrap code in proper "
            "markdown code blocks with language specification. For web development, create complete, "
            "functional examples. Include HTML, CSS, and JavaScript when creating web interfaces. "
            "Make code practical and immediately usable. Always explain what the code does."
        )
        enhanced_message = f"{system_prompt}\n\nUser request: {message}"

        try:
            response = self.model.generate_content(enhanced_message, stream=True)

            full_response = ""
            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    yield {
                        'type': 'content',
                        'content': chunk.text
                    }

            code_blocks = self.extract_code_blocks(full_response)
            artifacts = []

            for i, block in enumerate(code_blocks):
                artifact_type = self.detect_artifact_type(block['code'], block['language'])

                artifacts.append({
                    'id': f"artifact_{i}_{hash(block['code']) % 1000}",
                    'type': artifact_type,
                    'language': block['language'],
                    'code': block['code'],
                    'title': f"{artifact_type.capitalize()} Code"
                })

            if artifacts:
                yield {
                    'type': 'artifacts',
                    'artifacts': artifacts
                }

        except Exception as e:
            yield {
                'type': 'error',
                'content': f"Error streaming response: {str(e)}"
            }

    async def generate_response_with_memory(self, message: str, conversation_id: str = None) -> dict:
        try:
            result = await conversation_memory.ainvoke_with_memory(message, conversation_id)

            code_blocks = self.extract_code_blocks(result['response'])
            artifacts = []

            for i, block in enumerate(code_blocks):
                artifact_type = self.detect_artifact_type(block['code'], block['language'])

                artifacts.append({
                    'id': f"artifact_{i}_{hash(block['code']) % 1000}",
                    'type': artifact_type,
                    'language': block['language'],
                    'code': block['code'],
                    'title': f"{artifact_type.capitalize()} Code"
                })

            return {
                'response': result['response'],
                'artifacts': artifacts,
                'conversation_id': result['conversation_id']
            }

        except Exception as e:
            return {
                'response': f"Error generating response with memory: {str(e)}",
                'artifacts': [],
                'conversation_id': conversation_id
            }

    async def stream_response_with_memory(
        self,
        message: str,
        conversation_id: str = None
    ) -> AsyncGenerator[Dict, None]:
        try:
            async for chunk in conversation_memory.astream_with_memory(message, conversation_id):
                if chunk['type'] == 'content':
                    yield {
                        'type': 'content',
                        'content': chunk['content']
                    }
                elif chunk['type'] == 'complete':
                    code_blocks = self.extract_code_blocks(chunk['full_response'])
                    artifacts = []

                    for i, block in enumerate(code_blocks):
                        artifact_type = self.detect_artifact_type(block['code'], block['language'])

                        artifacts.append({
                            'id': f"artifact_{i}_{hash(block['code']) % 1000}",
                            'type': artifact_type,
                            'language': block['language'],
                            'code': block['code'],
                            'title': f"{artifact_type.capitalize()} Code"
                        })

                    yield {
                        'type': 'complete',
                        'artifacts': artifacts,
                        'conversation_id': chunk['conversation_id']
                    }

        except Exception as e:
            yield {
                'type': 'error',
                'content': f"Error streaming response with memory: {str(e)}"
            }


# Create global instance
gemini_service = GeminiService()
