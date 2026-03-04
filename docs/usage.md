# Usage Guide

Talk to the bot by messaging it in Discord. The bot only responds to the configured `DISCORD_ALLOWED_USER_ID`.

---

## Adding Contacts

```
You: Add Sarah Chen, VIP, met at Leeds alumni event last week. She's a product
     manager at Salesforce in Denver. Birthday is March 15.

Bot: Added Sarah Chen (VIP)
     Company: Salesforce | Role: Product Manager | Location: Denver
     Birthday: March 15
     Next follow-up: March 24
```

```
You: Add Jake Torres, met at a marketing conference. He runs an agency called
     Breck Agency, account director. Broader network.

Bot: Added Jake Torres (broader)
     Company: Breck Agency | Role: Account Director
     Next follow-up: June 1
```

---

## Logging Interactions

```
You: Log that I grabbed coffee with Marcus today — we talked about his job search
     in consulting.

Bot: Logged interaction with Marcus (acquaintance)
     Type: coffee | March 3, 2026
     Next follow-up set: April 14
```

---

## Finding Contacts

```
You: Remind me about Sarah Chen

Bot: Sarah Chen — VIP
     Company: Salesforce | Role: Product Manager | Denver
     Birthday: March 15
     Last contact: March 3 | Next follow-up: March 24

     Recent interactions:
     • Coffee (March 3) — Talked about her move to Denver, new PM role
```

---

## Industry / Company Lookups

```
You: Who do I know in marketing agencies?

Bot: Found 3 contacts in marketing:
     • Jake Torres (broader) — Account Director at Breck Agency | Last: Oct 2025
     • Priya Mehta (acquaintance) — Marketing Manager at Studio Sci | Last: Nov 2025
     • Tom Walsh (broader) — Founder at WalshCreative | Last: Sep 2025
```

---

## Follow-up Reminders

```
You: Who should I check in with this week?

Bot: Follow-ups due in the next 7 days:
     • Sarah Chen (VIP) — due March 5 — Haven't connected since you met at Leeds event
     • Jake Torres (broader) — due March 7 — Last: coffee in January
     • Priya Mehta (acquaintance) — due March 9 — Last: LinkedIn Nov 2025
```

---

## Birthday Reminders

```
You: Any birthdays coming up?

Bot: Birthdays in the next 14 days:
     • Sarah Chen — March 15 (VIP)
       No gift idea stored yet — want to brainstorm one?
```

---

## Tags

```
You: Tag Sarah Chen as "bain-network"

Bot: Tagged Sarah Chen (id 1) with 'bain-network'

You: Who's tagged bain-network?

Bot: 2 contacts tagged 'bain-network':
     • Sarah Chen (VIP) — Salesforce
     • Marcus Webb (acquaintance) — Bain & Company
```

---

## Dynamic Schema Evolution

```
You: Start tracking birthday gift ideas for contacts.

Bot: Added column 'birthday_gift_ideas' (TEXT) to contacts.
     I'll start noting gift ideas when you mention them.

You: Note that Sarah Chen would love a book on product strategy.

Bot: Updated Sarah Chen — birthday_gift_ideas: "book on product strategy"
```

---

## Morning Briefing

Every morning at the configured hour, the bot sends to your briefing channel:

```
Good morning. Here's your daily CRM briefing:

Follow-ups due (next 7 days):
• Sarah Chen (VIP) — due today — Met at Leeds event Feb 24

Birthdays (next 14 days):
• Marcus Webb — March 10 (acquaintance)
  Gift idea stored: "whisky"

Nothing else due this week.
```

---

## Commands

| Command | Effect |
|---|---|
| `!reset` | Clear conversation history (start fresh context with Claude) |

---

## Tips

- Tier is inferred from context if not stated — "close friend" → VIP, "met at a networking event" → broader
- The bot remembers your conversation within a session — you can refer back to "the person I just added"
- After `!reset`, the bot starts fresh but the database is unchanged
