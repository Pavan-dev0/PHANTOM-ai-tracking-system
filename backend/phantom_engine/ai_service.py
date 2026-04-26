from __future__ import annotations

import json
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
import os


ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=ENV_PATH)


def _strip_code_fences(content: str) -> str:
    cleaned = content.strip()

    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines:
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    return cleaned


def classify_intent(phone_activity_notes: str) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in the .env file.")

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a missing persons investigation analyst. "
                    "You must always respond with valid JSON only. "
                    "Never add any explanation, markdown, or code fences. "
                    "Only return the raw JSON object."
                ),
            },
            {
                "role": "user",
                "content": (
                    "A missing person's recent phone activity is described below.\n"
                    "Based only on this activity classify the most likely destination \n"
                    "category the person was heading toward.\n\n"
                    f"Phone activity: {phone_activity_notes}\n\n"
                    "Return ONLY a valid JSON object with exactly these five fields:\n"
                    "destination_category: one of transport_hub, isolated_outdoor,\n"
                    "water_body, familiar_place, urban_crowded, unknown\n"
                    "confidence: a float between 0.0 and 1.0\n"
                    "reasoning: one clear sentence explaining why\n"
                    "gaps: one sentence listing what information was missing or unclear\n"
                    "intent_stage: one of vague, narrowing, specific, action"
                ),
            },
        ],
    )

    content = response.choices[0].message.content or ""
    cleaned_content = _strip_code_fences(content)
    return json.loads(cleaned_content)
