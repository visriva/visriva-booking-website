#!/usr/bin/env python3
"""
Visriva WhatsApp CRM Bridge
────────────────────────────────────────────────────────────────────────────
Connects your Firestore Booking CRM leads to WhatsApp using YOUR OWN number.
Uses Gemini LLM to compose personalised follow-up messages, then opens
WhatsApp Web with the message pre-filled — you just press Send.

No Twilio. No API approval. Works with any personal/business WhatsApp number.

Requirements:
  pip install firebase-admin google-generativeai python-dotenv rich

.env file needed:
  GEMINI_API_KEY=AIzaSy...
  FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json

Usage:
  python whatsapp_crm_bridge.py               # Interactive CLI menu
  python whatsapp_crm_bridge.py --list        # List all Firestore leads
  python whatsapp_crm_bridge.py --followup    # Send AI follow-ups to new leads
  python whatsapp_crm_bridge.py --sync        # Show CRM stats
  python whatsapp_crm_bridge.py --chat PHONE  # AI chat session with a lead
"""

import argparse
import os
import sys
import webbrowser
import urllib.parse
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, Confirm
from rich import box

load_dotenv()
console = Console()

# ─── CONFIG ──────────────────────────────────────────────────────────────────
GEMINI_API_KEY       = os.getenv("GEMINI_API_KEY", "")
FIREBASE_CREDS       = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")

# Your own WhatsApp number — leads will receive messages FROM this number
YOUR_WHATSAPP_NUMBER = "918884484828"   # +91 88844 84828 (Visriva)


# ─── LAZY IMPORTS ─────────────────────────────────────────────────────────────

def import_firebase():
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        return firebase_admin, credentials, firestore
    except ImportError:
        console.print("[bold red]❌ firebase-admin not installed.[/]\nRun: [cyan]pip install firebase-admin[/]")
        sys.exit(1)


def import_gemini():
    try:
        import google.generativeai as genai
        return genai
    except ImportError:
        console.print("[bold red]❌ google-generativeai not installed.[/]\nRun: [cyan]pip install google-generativeai[/]")
        sys.exit(1)


# ─── FIREBASE / FIRESTORE ────────────────────────────────────────────────────

_db = None

def get_firestore():
    global _db
    if _db:
        return _db
    firebase_admin, credentials, firestore = import_firebase()
    if not firebase_admin._apps:
        if not os.path.exists(FIREBASE_CREDS):
            console.print(f"[bold red]❌ Firebase credentials not found: {FIREBASE_CREDS}[/]")
            console.print("Download it from Firebase Console → Project Settings → Service Accounts")
            sys.exit(1)
        cred = credentials.Certificate(FIREBASE_CREDS)
        firebase_admin.initialize_app(cred)
    _db = firestore.client()
    return _db


def fetch_booking_leads(limit: int = 50) -> list[dict]:
    """Fetch recent booking leads from Firestore 'bookingLeads' collection."""
    db = get_firestore()
    try:
        docs = (
            db.collection("bookingLeads")
            .order_by("createdAt", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        leads = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            leads.append(data)
        return leads
    except Exception as e:
        console.print(f"[yellow]⚠️  Could not fetch from Firestore: {e}[/]")
        console.print("[dim]Check your Firebase credentials and collection name.[/]")
        return []


def update_lead_status(lead_id: str, status: str, note: str = ""):
    """Update lead CRM status in Firestore."""
    try:
        db = get_firestore()
        db.collection("bookingLeads").document(lead_id).update({
            "crmStatus": status,
            "lastContactedAt": datetime.utcnow().isoformat(),
            "crmNote": note,
        })
        console.print(f"  [dim]✓ Firestore updated → {status}[/]")
    except Exception as e:
        console.print(f"  [yellow]⚠️  Could not update Firestore: {e}[/]")


# ─── GEMINI LLM ───────────────────────────────────────────────────────────────

def get_gemini_model():
    genai = import_gemini()
    if not GEMINI_API_KEY:
        console.print("[bold red]❌ GEMINI_API_KEY not set in .env file.[/]")
        console.print("Get one free from: [blue underline]https://aistudio.google.com/app/apikey[/]")
        sys.exit(1)
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-1.5-flash")


def ai_compose_followup(lead: dict) -> str:
    """Use Gemini to write a warm, personalised WhatsApp follow-up message."""
    model = get_gemini_model()

    name     = lead.get("customerName") or lead.get("guestName", "there")
    event    = lead.get("eventType", "upcoming event")
    date     = lead.get("eventDate", "")
    services = lead.get("selectedServices") or lead.get("services", [])
    budget   = lead.get("budget", "")
    location = lead.get("eventLocation", "")

    prompt = f"""You are Drupitha, a warm and professional event advisor at Visriva Live Station — a luxury live event printing company in Bengaluru and Pune, India.

A potential customer submitted a booking inquiry. Write a personalised WhatsApp follow-up message to send FROM our business WhatsApp.

Customer Details:
- Name: {name}
- Event Type: {event}
- Event Date: {date or "Not specified"}
- Services Interested In: {", ".join(services) if services else "Not specified"}
- Budget: {budget or "Not specified"}
- Location: {location or "Not specified"}

RULES:
- Start with a warm greeting using their first name
- Reference their specific event details naturally
- Keep it under 100 words — WhatsApp messages must be concise
- End with ONE clear call-to-action (reply, call, or confirm date)
- Tone: warm, luxury, professional — like a personal concierge
- Do NOT use more than 2 emojis total
- Do NOT mention fake pricing or fake availability
- Write ONLY the message body. No subject line. No labels.

Write the WhatsApp message now:"""

    response = model.generate_content(prompt)
    return response.text.strip()


def ai_answer_query(customer_message: str, lead: dict) -> str:
    """Use Gemini to answer a customer's incoming WhatsApp message."""
    model = get_gemini_model()

    name  = lead.get("customerName") or lead.get("guestName", "there")
    event = lead.get("eventType", "their event")

    prompt = f"""You are Drupitha, a warm event advisor at Visriva Live Station, Bengaluru.

Customer: {name}
Their Event: {event}
Their Message: "{customer_message}"

Visriva Services:
- Instant Photo Booth: DSLR prints in 8 sec, ~120/hr
- Custom Fridge Magnets: Acrylic portrait, ~130/hr  
- Acrylic Keychains: ~110/hr
- Live Mug Printing: ~70/hr (not for 400+ guests)
- Tote Bag & T-Shirt: ~60/hr

Pricing starts from ₹12,000 for 2-hour packages.
Contact: +91 88844 84828

Write a warm, helpful reply under 80 words. End with a question or next step.
Write ONLY the reply message:"""

    response = model.generate_content(prompt)
    return response.text.strip()


# ─── WHATSAPP LINK GENERATOR ──────────────────────────────────────────────────

def make_wa_link(to_phone: str, message: str) -> str:
    """
    Generate a wa.me link to send a WhatsApp message FROM your own number.
    Opening this link in a browser opens WhatsApp Web/App with the
    message pre-filled to the customer. You just press Send.
    """
    # Clean the phone number — remove spaces, dashes, +
    clean = to_phone.strip().replace("+", "").replace(" ", "").replace("-", "")
    encoded_msg = urllib.parse.quote(message)
    return f"https://wa.me/{clean}?text={encoded_msg}"


def open_wa_link(to_phone: str, message: str) -> str:
    """Generate the link AND open it in the default browser."""
    link = make_wa_link(to_phone, message)
    webbrowser.open(link)
    return link


# ─── CLI COMMANDS ─────────────────────────────────────────────────────────────

def cmd_list_leads():
    """List all booking leads from Firestore."""
    console.print()
    console.print(Panel(
        "[bold gold1]📋 Booking CRM — Firestore Leads[/]",
        border_style="gold3", expand=False
    ))
    leads = fetch_booking_leads(30)

    if not leads:
        console.print("[italic dim]No leads found in Firestore 'bookingLeads' collection.[/]")
        return leads

    table = Table(box=box.ROUNDED, border_style="gold3", show_lines=True)
    table.add_column("#", style="dim", width=4, justify="right")
    table.add_column("Name", style="bold white", min_width=14)
    table.add_column("Event", style="cyan", min_width=16)
    table.add_column("Date", style="yellow", min_width=10)
    table.add_column("Phone", style="green", min_width=14)
    table.add_column("Services", style="magenta", min_width=18)
    table.add_column("Status", min_width=10)

    for i, lead in enumerate(leads, 1):
        status = lead.get("crmStatus", "New")
        status_styles = {
            "New":       "[bold green]🟢 New[/]",
            "Contacted": "[yellow]🟡 Contacted[/]",
            "Won":       "[bold green]🏆 Won[/]",
            "Closed":    "[dim]⚫ Closed[/]",
        }
        table.add_row(
            str(i),
            lead.get("customerName") or lead.get("guestName", "—"),
            lead.get("eventType", "—"),
            lead.get("eventDate", "—"),
            lead.get("customerPhone") or lead.get("phone", "—"),
            ", ".join(lead.get("selectedServices") or lead.get("services", [])) or "—",
            status_styles.get(status, f"[white]{status}[/]"),
        )

    console.print(table)
    console.print(f"\n[dim]Total: {len(leads)} leads[/]\n")
    return leads


def cmd_send_followups():
    """AI-compose and send WhatsApp follow-ups to all New leads via wa.me links."""
    console.print()
    console.print(Panel(
        "[bold gold1]🤖 AI Follow-Up Composer — Powered by Gemini[/]\n"
        "[dim]Gemini writes personalised messages → opens WhatsApp from your number[/]",
        border_style="gold3", expand=False
    ))

    leads = fetch_booking_leads(50)
    new_leads = [l for l in leads if l.get("crmStatus", "New") == "New"]

    if not new_leads:
        console.print("[bold green]✅ No new leads pending. All caught up![/]\n")
        return

    console.print(f"Found [bold]{len(new_leads)}[/] new uncontacted lead(s).\n")

    for lead in new_leads:
        name  = lead.get("customerName") or lead.get("guestName", "Guest")
        phone = lead.get("customerPhone") or lead.get("phone", "")
        event = lead.get("eventType", "?")

        console.rule(f"[bold white]{name}[/] — {event}")

        if not phone:
            console.print("  [dim]⚠️  No phone number on file. Skipping.[/]\n")
            continue

        console.print(f"  📱 To: [green]{phone}[/]")
        console.print("  [dim]Composing AI message via Gemini...[/]", end=" ")

        try:
            message = ai_compose_followup(lead)
        except Exception as e:
            console.print(f"[red]Error: {e}[/]")
            continue

        console.print("[green]Done![/]")
        console.print(Panel(message, title="[cyan]Drupitha's Draft Message[/]", border_style="cyan"))

        action = Prompt.ask(
            "  Action",
            choices=["send", "edit", "skip"],
            default="send"
        )

        if action == "edit":
            console.print("  [dim]Edit the message (press Enter twice when done):[/]")
            lines = []
            while True:
                line = input("  ")
                if line == "" and lines and lines[-1] == "":
                    break
                lines.append(line)
            message = "\n".join(lines[:-1]).strip() or message

        if action in ("send", "edit"):
            link = open_wa_link(phone, message)
            console.print(f"\n  [bold green]✅ WhatsApp opened![/] Message to [green]{name}[/] is pre-filled.")
            console.print(f"  [dim]Just press Send in WhatsApp.[/]")
            console.print(f"  [dim blue]Link: {link[:80]}...[/]\n")
            update_lead_status(lead["id"], "Contacted", f"Follow-up sent via WhatsApp link")
        else:
            console.print("  [dim]Skipped.[/]\n")

    console.print("\n[bold green]✅ All leads processed![/]\n")


def cmd_chat(phone: Optional[str] = None):
    """Interactive AI chat session — compose replies to customer messages."""
    console.print()
    leads = fetch_booking_leads(50)

    if not phone:
        leads = cmd_list_leads()
        if not leads:
            return
        try:
            idx = int(Prompt.ask("Enter lead number")) - 1
            lead = leads[idx]
        except (ValueError, IndexError):
            console.print("[red]Invalid selection.[/]")
            return
    else:
        lead = next(
            (l for l in leads if phone.replace("+", "") in
             (l.get("customerPhone") or l.get("phone", "")).replace("+", "")),
            None
        )
        if not lead:
            console.print(f"[red]No lead found with phone: {phone}[/]")
            return

    name  = lead.get("customerName") or lead.get("guestName", "Guest")
    phone_num = lead.get("customerPhone") or lead.get("phone", "")

    console.print(Panel(
        f"[bold gold1]💬 AI Chat Session — {name}[/]\n"
        f"[dim]Phone: {phone_num} | Event: {lead.get('eventType', '?')}[/]\n\n"
        f"[dim]Paste what the customer sent you, Drupitha will write your reply.[/]\n"
        f"[dim]Type 'quit' to exit.[/]",
        border_style="gold3"
    ))

    while True:
        console.print()
        customer_msg = Prompt.ask("[cyan]Customer's message[/]")
        if customer_msg.lower().strip() in ("quit", "exit", "q", "bye"):
            console.print("[dim]Chat session ended.[/]")
            break

        console.print("[dim]  Drupitha is thinking...[/]", end=" ")
        try:
            reply = ai_answer_query(customer_msg, lead)
        except Exception as e:
            console.print(f"[red]Error: {e}[/]")
            continue
        console.print("[green]Done![/]")

        console.print(Panel(reply, title="[bold green]Drupitha's Reply[/]", border_style="green"))

        send = Confirm.ask("  Send this reply to customer via WhatsApp?", default=True)
        if send and phone_num:
            link = open_wa_link(phone_num, reply)
            console.print(f"  [bold green]✅ WhatsApp opened![/] Just press Send.")
            update_lead_status(lead["id"], "Contacted", f"Chat reply: {customer_msg[:50]}...")


def cmd_sync():
    """Show CRM stats summary from Firestore."""
    console.print()
    console.print(Panel(
        "[bold gold1]🔄 Visriva CRM Sync — Firestore Summary[/]",
        border_style="gold3", expand=False
    ))
    leads = fetch_booking_leads(200)

    if not leads:
        console.print("[dim]No leads found.[/]\n")
        return

    new       = sum(1 for l in leads if l.get("crmStatus", "New") == "New")
    contacted = sum(1 for l in leads if l.get("crmStatus") == "Contacted")
    won       = sum(1 for l in leads if l.get("crmStatus") == "Won")
    closed    = sum(1 for l in leads if l.get("crmStatus") == "Closed")
    total     = len(leads)

    console.print(f"  [bold green]🟢 New Leads       :[/]  {new}")
    console.print(f"  [yellow]🟡 Contacted        :[/]  {contacted}")
    console.print(f"  [bold green]🏆 Won / Booked     :[/]  {won}")
    console.print(f"  [dim]⚫ Closed           :[/]  {closed}")
    console.print(f"  [white]📊 Total Leads       :[/]  {total}")
    console.print()
    console.print(f"  [dim]Your WhatsApp: +{YOUR_WHATSAPP_NUMBER}[/]")
    console.print(f"  [dim]Firebase credentials: {FIREBASE_CREDS}[/]")
    console.print()


# ─── INTERACTIVE MENU ─────────────────────────────────────────────────────────

def interactive_menu():
    console.print(Panel.fit(
        "[bold gold1]✨ Visriva WhatsApp CRM Bridge[/]\n"
        "[dim]AI-powered lead follow-ups from YOUR OWN WhatsApp number[/]\n"
        f"[dim]Your number: +{YOUR_WHATSAPP_NUMBER}[/]",
        border_style="gold3",
        padding=(1, 3),
    ))
    console.print()

    options = [
        ("1", "📋  List all booking leads",                  cmd_list_leads),
        ("2", "🤖  AI follow-ups for new leads",             cmd_send_followups),
        ("3", "💬  Chat session with a specific lead",       cmd_chat),
        ("4", "🔄  CRM sync & stats",                        cmd_sync),
        ("5", "❌  Exit",                                     None),
    ]

    for key, label, _ in options:
        console.print(f"  [bold cyan]{key}.[/]  {label}")

    console.print()
    choice = Prompt.ask("Choose", choices=[o[0] for o in options], default="1")

    for key, label, func in options:
        if choice == key:
            if func:
                func()
            else:
                console.print("\n[dim]Goodbye! 👋[/]\n")
                sys.exit(0)
            break


# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Visriva WhatsApp CRM — Gemini AI + Firestore + Your Own WhatsApp"
    )
    parser.add_argument("--list",     action="store_true",  help="List all booking leads")
    parser.add_argument("--followup", action="store_true",  help="AI follow-ups for new leads")
    parser.add_argument("--sync",     action="store_true",  help="Show CRM stats")
    parser.add_argument("--chat",     metavar="PHONE",      help="Chat session with a specific phone number")
    args = parser.parse_args()

    if args.list:
        cmd_list_leads()
    elif args.followup:
        cmd_send_followups()
    elif args.sync:
        cmd_sync()
    elif args.chat:
        cmd_chat(args.chat)
    else:
        # Interactive loop
        while True:
            try:
                interactive_menu()
                console.print()
            except KeyboardInterrupt:
                console.print("\n\n[dim]Goodbye! 👋[/]\n")
                sys.exit(0)
