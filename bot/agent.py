"""Claude tool-use agent loop.

`process_message` is the single entry point. It maintains per-user conversation
history in memory, calls the Anthropic API, executes any tool calls Claude
requests, and iterates until Claude produces a final text response.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import anthropic
from dotenv import load_dotenv

import crm.tools as crm_tools

load_dotenv()

_REPO_ROOT = Path(__file__).parent.parent
_AGENTS_MD = _REPO_ROOT / "config" / "AGENTS.md"

CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
DB_PATH: str = os.getenv("DB_PATH", str(_REPO_ROOT / "db" / "crm.db"))
SYSTEM_PROMPT: str = _AGENTS_MD.read_text(encoding="utf-8")

_client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

_histories: dict[int, list[dict[str, Any]]] = {}

_TOOL_REGISTRY = {
    "crm_add_contact": crm_tools.crm_add_contact,
    "crm_update_contact": crm_tools.crm_update_contact,
    "crm_find_contact": crm_tools.crm_find_contact,
    "crm_list_contacts": crm_tools.crm_list_contacts,
    "crm_log_interaction": crm_tools.crm_log_interaction,
    "crm_search_by_industry": crm_tools.crm_search_by_industry,
    "crm_get_upcoming_followups": crm_tools.crm_get_upcoming_followups,
    "crm_get_upcoming_birthdays": crm_tools.crm_get_upcoming_birthdays,
    "crm_add_schema_column": crm_tools.crm_add_schema_column,
    "crm_add_tag": crm_tools.crm_add_tag,
    "crm_find_by_tag": crm_tools.crm_find_by_tag,
}


async def _dispatch_tool(tool_name: str, tool_input: dict[str, Any]) -> dict:
    """Route a tool call to the appropriate crm.tools function."""
    handler = _TOOL_REGISTRY.get(tool_name)
    if handler is None:
        return {"success": False, "error": f"Unknown tool: {tool_name}"}
    return await handler(DB_PATH, **tool_input)


TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "crm_add_contact",
        "description": "Add a new contact to the CRM database.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Full name"},
                "tier": {"type": "string", "enum": ["vip", "acquaintance", "broader"]},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "location": {"type": "string", "description": "City / state"},
                "company": {"type": "string"},
                "industry": {"type": "string"},
                "role": {"type": "string", "description": "Job title"},
                "birthday": {"type": "string", "description": "YYYY-MM-DD"},
                "how_met": {"type": "string"},
                "notes": {"type": "string"},
                "next_followup": {"type": "string", "description": "YYYY-MM-DD — auto-calculated if omitted"},
            },
            "required": ["name", "tier"],
        },
    },
    {
        "name": "crm_update_contact",
        "description": "Update one or more fields on an existing contact.",
        "input_schema": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "description": "Contact ID"},
                "fields": {
                    "type": "object",
                    "description": "Dict of column names to new values",
                },
            },
            "required": ["id", "fields"],
        },
    },
    {
        "name": "crm_find_contact",
        "description": "Search for contacts by name, company, or notes. Returns up to 5 matches with recent interactions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search term"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "crm_list_contacts",
        "description": "List contacts, optionally filtered by tier.",
        "input_schema": {
            "type": "object",
            "properties": {
                "tier": {"type": "string", "enum": ["vip", "acquaintance", "broader"]},
                "limit": {"type": "integer", "default": 20},
            },
        },
    },
    {
        "name": "crm_log_interaction",
        "description": "Log a touchpoint with a contact. Updates last_contact and resets next_followup.",
        "input_schema": {
            "type": "object",
            "properties": {
                "contact_id": {"type": "integer"},
                "type": {
                    "type": "string",
                    "enum": ["text", "email", "call", "coffee", "linkedin", "event", "other"],
                },
                "summary": {"type": "string", "description": "What was discussed"},
                "date": {"type": "string", "description": "YYYY-MM-DD — defaults to today"},
            },
            "required": ["contact_id", "type", "summary"],
        },
    },
    {
        "name": "crm_search_by_industry",
        "description": "Find contacts by industry or company.",
        "input_schema": {
            "type": "object",
            "properties": {
                "industry": {"type": "string"},
                "company": {"type": "string"},
            },
        },
    },
    {
        "name": "crm_get_upcoming_followups",
        "description": "Return contacts whose next_followup date falls within N days from today.",
        "input_schema": {
            "type": "object",
            "properties": {
                "days": {"type": "integer", "default": 7},
            },
        },
    },
    {
        "name": "crm_get_upcoming_birthdays",
        "description": "Return contacts with birthdays in the next N days.",
        "input_schema": {
            "type": "object",
            "properties": {
                "days": {"type": "integer", "default": 14},
            },
        },
    },
    {
        "name": "crm_add_schema_column",
        "description": "Dynamically add a new column to a CRM table so new data can be tracked.",
        "input_schema": {
            "type": "object",
            "properties": {
                "table_name": {"type": "string", "default": "contacts"},
                "column_name": {"type": "string"},
                "column_type": {"type": "string", "default": "TEXT"},
                "description": {"type": "string"},
            },
            "required": ["column_name"],
        },
    },
    {
        "name": "crm_add_tag",
        "description": "Tag a contact with a label.",
        "input_schema": {
            "type": "object",
            "properties": {
                "contact_id": {"type": "integer"},
                "tag_name": {"type": "string"},
            },
            "required": ["contact_id", "tag_name"],
        },
    },
    {
        "name": "crm_find_by_tag",
        "description": "Find all contacts with a given tag.",
        "input_schema": {
            "type": "object",
            "properties": {
                "tag_name": {"type": "string"},
            },
            "required": ["tag_name"],
        },
    },
]


def _extract_text(response: anthropic.types.Message) -> str:
    """Pull all TextBlock content from a message into a single string."""
    parts = [
        block.text
        for block in response.content
        if hasattr(block, "text")
    ]
    return "\n".join(parts).strip()


async def process_message(user_id: int, user_message: str) -> str:
    """Process a user message through the Claude tool-use loop.

    Maintains per-user conversation history. Returns Claude's final text reply.
    """
    history = _histories.setdefault(user_id, [])
    history.append({"role": "user", "content": user_message})

    while True:
        response = await _client.messages.create(
            model=CLAUDE_MODEL,
            system=SYSTEM_PROMPT,
            tools=TOOL_DEFINITIONS,
            messages=history,
            max_tokens=4096,
        )

        if response.stop_reason == "end_turn":
            final_text = _extract_text(response)
            history.append({"role": "assistant", "content": response.content})
            return final_text or "(no response)"

        if response.stop_reason == "tool_use":
            history.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = await _dispatch_tool(block.name, block.input)
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result),
                        }
                    )

            history.append({"role": "user", "content": tool_results})
            continue

        return f"[Unexpected stop_reason: {response.stop_reason}]"


def clear_history(user_id: int) -> None:
    """Clear conversation history for a user (e.g. on !reset command)."""
    _histories.pop(user_id, None)
