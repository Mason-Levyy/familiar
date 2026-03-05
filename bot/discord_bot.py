"""Discord bot entry point.

Run with:
    py -3 -m bot.discord_bot

The bot listens for messages from a single allowed user ID and routes them
through the Claude agent loop. A scheduled morning briefing fires daily at
the configured hour.
"""

from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path

import discord
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from discord.ext import commands
from dotenv import load_dotenv

from bot import agent

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
log = logging.getLogger("familiar")

DISCORD_BOT_TOKEN: str = os.environ["DISCORD_BOT_TOKEN"]
ALLOWED_USER_ID: int = int(os.environ["DISCORD_ALLOWED_USER_ID"])
BRIEFING_CHANNEL_ID: int | None = (
    int(os.environ["DISCORD_BRIEFING_CHANNEL_ID"])
    if os.getenv("DISCORD_BRIEFING_CHANNEL_ID")
    else None
)
BRIEFING_HOUR: int = int(os.getenv("BRIEFING_HOUR", "8"))
BRIEFING_MINUTE: int = int(os.getenv("BRIEFING_MINUTE", "0"))
DISCORD_MESSAGE_LIMIT = 2000


def _split_response(text: str) -> list[str]:
    """Split a long response into Discord-safe chunks (≤2000 chars)."""
    if len(text) <= DISCORD_MESSAGE_LIMIT:
        return [text]

    chunks: list[str] = []
    while text:
        if len(text) <= DISCORD_MESSAGE_LIMIT:
            chunks.append(text)
            break
        split_at = text.rfind("\n", 0, DISCORD_MESSAGE_LIMIT)
        if split_at == -1:
            split_at = DISCORD_MESSAGE_LIMIT
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")

    return chunks


intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)
scheduler = AsyncIOScheduler()


@bot.event
async def on_ready() -> None:
    log.info("Logged in as %s (id=%s)", bot.user, bot.user.id)
    scheduler.start()
    log.info("Scheduler started — briefing at %02d:%02d", BRIEFING_HOUR, BRIEFING_MINUTE)


@bot.event
async def on_message(message: discord.Message) -> None:
    if message.author.bot:
        return

    if message.author.id != ALLOWED_USER_ID:
        return

    await bot.process_commands(message)

    ctx = await bot.get_context(message)
    if ctx.valid:
        return

    async with message.channel.typing():
        try:
            response_text = await agent.process_message(message.author.id, message.content)
        except Exception as exc:
            log.exception("Agent error for user %s", message.author.id)
            response_text = f"Something went wrong: {exc}"

    for chunk in _split_response(response_text):
        await message.channel.send(chunk)


@bot.command(name="reset")
async def reset_history(ctx: commands.Context) -> None:
    """Clear conversation history (start fresh context)."""
    if ctx.author.id != ALLOWED_USER_ID:
        return
    agent.clear_history(ctx.author.id)
    await ctx.send("Conversation history cleared.")


@scheduler.scheduled_job("cron", hour=BRIEFING_HOUR, minute=BRIEFING_MINUTE)
async def morning_briefing() -> None:
    if BRIEFING_CHANNEL_ID is None:
        log.warning("DISCORD_BRIEFING_CHANNEL_ID not set — skipping morning briefing")
        return

    channel = bot.get_channel(BRIEFING_CHANNEL_ID)
    if channel is None:
        log.error("Briefing channel %s not found", BRIEFING_CHANNEL_ID)
        return

    log.info("Sending morning briefing to channel %s", BRIEFING_CHANNEL_ID)
    try:
        briefing_text = await agent.process_message(
            ALLOWED_USER_ID,
            "Morning briefing: check upcoming follow-ups (next 7 days) and upcoming birthdays (next 14 days). Surface anything actionable.",
        )
    except Exception as exc:
        log.exception("Morning briefing failed")
        briefing_text = f"Morning briefing failed: {exc}"

    for chunk in _split_response(briefing_text):
        await channel.send(chunk)


if __name__ == "__main__":
    bot.run(DISCORD_BOT_TOKEN, log_handler=None)
