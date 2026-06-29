"""Centralized Google Gemini API integration for Vista-IQ."""

import os
import json
import logging
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from pydantic import BaseModel

from backend.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

HAS_GEMINI = False
if settings.gemini_api_key and settings.gemini_api_key != "your-gemini-key":
    try:
        genai.configure(api_key=settings.gemini_api_key)
        HAS_GEMINI = True
        logger.info("Google Gemini API configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Google Gemini API: {e}")


def get_model(model_name="gemini-1.5-flash", system_instruction=None, response_mime_type=None):
    """Get a configured Gemini model instance."""
    if not HAS_GEMINI:
        return None
    
    generation_config = GenerationConfig(
        temperature=0.7,
        top_p=0.95,
        top_k=64,
        max_output_tokens=8192,
        response_mime_type=response_mime_type,
    )

    return genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_instruction,
        generation_config=generation_config
    )


async def generate_text_response(prompt: str, system_instruction: str = None) -> str:
    """Generate a standard text response using Gemini."""
    model = get_model(system_instruction=system_instruction)
    if not model:
        raise ValueError("Gemini API is not configured or available.")

    try:
        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error in Gemini text generation: {e}")
        raise


async def generate_json_response(prompt: str, system_instruction: str = None) -> dict | list:
    """Generate a structured JSON response using Gemini."""
    # Force the model to output JSON
    model = get_model(
        system_instruction=system_instruction, 
        response_mime_type="application/json"
    )
    if not model:
        raise ValueError("Gemini API is not configured or available.")

    try:
        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        
        # Clean up Markdown formatting if Gemini accidentally includes it
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini JSON response: {e}. Raw text: {response.text}")
        raise
    except Exception as e:
        logger.error(f"Error in Gemini JSON generation: {e}")
        raise
