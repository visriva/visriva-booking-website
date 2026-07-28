import { NextResponse } from "next/server";

// ─── RIYA PERSONA (For Gemini API path) ──────────────────────────────────────
const DRUPITHA_PERSONA = `You are Drupitha, a warm, intelligent, and luxury-focused event advisor at Visriva Live Station — a premium live event printing company based in Bengaluru and Pune, India.

VISRIVA'S 5 LIVE STATIONS:
- Instant Photo Booth: DSLR camera, studio lighting, 8-second dye-sub prints, QR gallery. ~120 prints/hr. Best for weddings, galas, activations.
- Custom Fridge Magnets: Glossy acrylic with guest portrait, printed live. Most popular. ~130/hr. Great for any event.
- Acrylic Keychains: Crystal-clear, guest portrait, premium return gift. ~110/hr.
- Live Mug Printing: Ceramic sublimation. ~70/hr. NOT recommended for 400+ guests.
- Tote Bag & T-Shirt Station: Heat-press live. ~60/hr. Great for brand activations and fests.

CONVERSATION RULES:
1. Start by asking the guest's name first, then greet them warmly by name.
2. Ask ONE question at a time. Never ask multiple questions at once.
3. If a customer types gibberish or something unclear, ask for clarification ONCE — do not repeat endlessly.
4. Validate inputs: typos like "weddijjk" = Wedding, "haldi" = Haldi & Sangeet, random letters = ask for clarification.
5. After collecting name, event type, guest count, and preference — give a specific station recommendation.
6. Be warm, human, and conversational. You are like a knowledgeable friend, not a robot.
`;

// ─── INPUT VALIDATORS ─────────────────────────────────────────────────────────

function cleanName(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim().replace(/[^a-zA-Z\s'-]/g, "").trim();
  if (trimmed.length <= 1) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function parseEventType(raw?: string): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  const cleaned = lower.replace(/[^a-z\s]/g, "").trim();

  // Check for recognizable event keywords
  if (/haldi|mehendi|sangeet/.test(lower)) return "Haldi, Sangeet & Mehendi";
  if (/wed|marr|shaadi|recep|bridal|bride|groom/.test(lower)) return "Wedding & Reception";
  if (/corp|gala|b2b|office|summit|conference|seminar|agm|launch/.test(lower)) return "Corporate Gala & Launch";
  if (/brand|activation|fest|festival|expo|fair/.test(lower)) return "Brand Activation & Fest";
  if (/birth|bday|birthday|anniversary|anniv|milestone|sweet\s*16|18th|21st|25th|30th|40th|50th/.test(lower)) return "Birthday & Milestone Party";
  if (/party|celebration|function|get[\s-]?together/.test(lower)) return "Private Celebration";
  if (/engagement|ring|propose/.test(lower)) return "Engagement Ceremony";
  if (/farewell|retirement/.test(lower)) return "Farewell & Retirement Event";

  // If ≥ 4 letters and not all consonants → treat as custom event name
  if (cleaned.length >= 4 && !/^[bcdfghjklmnpqrstvwxyz]{4,}$/.test(cleaned)) {
    return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1);
  }

  return null; // gibberish
}

function parseGuestCount(raw?: string): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();

  // Extract numeric values
  const nums = raw.match(/\d+/g);
  if (nums) {
    const val = parseInt(nums[0], 10);
    if (val > 0 && val <= 100000) return `${val}`;
  }

  // Text-based counts
  if (/hundred/.test(lower)) return "100";
  if (/two\s*hundred/.test(lower)) return "200";
  if (/three\s*hundred/.test(lower)) return "300";
  if (/five\s*hundred/.test(lower)) return "500";
  if (/thousand/.test(lower)) return "1000";
  if (/small|intimate|few/.test(lower)) return "50";
  if (/large|grand|big/.test(lower)) return "500";
  if (/many|lots/.test(lower)) return "300";

  // If only gibberish letters with no numbers → null
  const cleaned = lower.replace(/[^a-z\s]/g, "").trim();
  if (cleaned.length >= 4 && !/^[bcdfghjklmnpqrstvwxyz]{4,}$/.test(cleaned)) {
    return cleaned; // approximate text answer
  }

  return null;
}

// ─── STATION RECOMMENDER ──────────────────────────────────────────────────────

function buildRecommendation(name: string, eventType: string, guestCount: string, preference: string) {
  const pax = parseInt(guestCount) || 200;
  const pref = preference.toLowerCase();

  // Determine best stations based on event + pax + preference
  const stations: string[] = [];
  let reasoning = "";

  if (/photo|memory|fun|interactive/.test(pref)) {
    stations.push("photo-booth");
    if (pax <= 300) stations.push("keychains");
    else stations.push("magnets");
    reasoning = `For ${eventType} with ~${pax} guests focused on interactive photo experiences, our Instant Photo Booth delivers 8-second live prints with a digital QR gallery. Paired with Acrylic Keychains as take-home keepsakes, your guests get both a digital memory and a physical souvenir.`;
  } else if (/souvenir|gift|return\s*gift|keepsake|take.home/.test(pref)) {
    stations.push("magnets");
    if (pax <= 200) stations.push("keychains");
    reasoning = `For a ${eventType} with ~${pax} guests focused on memorable take-home gifts, our Custom Fridge Magnets are the #1 choice — glossy, custom-printed live with every guest's portrait. Most talked-about souvenir at events.`;
  } else if (/corp|gift|brand|logo/.test(pref) || /corp|brand|launch/.test(eventType.toLowerCase())) {
    stations.push("totes");
    stations.push("magnets");
    reasoning = `For your ${eventType} with ~${pax} guests with a corporate gifting focus, Tote Bags printed live with your brand logo paired with Custom Magnets create a powerful dual-souvenir experience that reinforces your brand identity.`;
  } else if (/mug/.test(pref)) {
    if (pax > 400) {
      stations.push("magnets");
      reasoning = `We love the mug idea! However, for ${pax} guests, our Live Mug Printing (~70/hr) would create long queues. We'd recommend Custom Fridge Magnets instead for your scale — ~130/hr, zero waiting, maximum smiles!`;
    } else {
      stations.push("mugs");
      reasoning = `For your ${eventType} with ~${pax} guests, Live Mug Printing creates a premium, personalized keepsake. Each guest's photo is sublimated onto a ceramic mug in minutes — a truly luxurious gift.`;
    }
  } else {
    // Default: photo booth + magnets (most versatile combo)
    stations.push("photo-booth", "magnets");
    reasoning = `For your ${eventType} with ~${pax} guests, the classic Visriva combo of Instant Photo Booth + Custom Fridge Magnets delivers the highest guest satisfaction — ~250 printed souvenirs per hour with zero downtime.`;
  }

  const paxLabel = pax > 0 ? `${pax} guests` : guestCount;

  return {
    mode: "recommendation",
    recommendationTitle: `${name ? name + "'s" : "Visriva"} Curated Live Station Suite`,
    tagline: stations.map(s => stationLabel(s)).join(" + "),
    recommendedServices: stations,
    reasoning,
    capacityEstimate: `~${stations.length * 120} live keepsakes / hour`,
    suggestedPackageTier: pax >= 400 ? "Diamond Package" : pax >= 200 ? "Gold Package" : "Silver Package",
    whyEachStation: Object.fromEntries(
      stations.map(s => [s, stationWhyText(s, eventType, paxLabel)])
    ),
    nextStep: `Tap 'Apply to Booking Form' below or WhatsApp us to lock in your date for your ${eventType}${name ? `, ${name}` : ""}!`,
  };
}

function stationLabel(id: string): string {
  const map: Record<string, string> = {
    "photo-booth": "Instant Photo Booth",
    magnets: "Custom Fridge Magnets",
    keychains: "Acrylic Keychains",
    mugs: "Live Mug Printing",
    totes: "Tote Bag & T-Shirt Station",
  };
  return map[id] || id;
}

function stationWhyText(id: string, event: string, pax: string): string {
  const map: Record<string, string> = {
    "photo-booth": `Full-frame DSLR camera rig + 8-second dye-sublimation print engine — perfect for ${event}. Guests get an instant premium print as a keepsake.`,
    magnets: `Glossy acrylic magnetic portraits custom-printed live on-site — the #1 take-home souvenir for ${pax}.`,
    keychains: `Crystal-clear acrylic keychains with live guest portraits — a premium, pocket-sized memento your guests will keep forever.`,
    mugs: `Ceramic sublimation mugs printed live with each guest's portrait — a truly luxurious and personal keepsake.`,
    totes: `Eco-friendly tote bags with your brand/event design, heat-pressed live — perfect for corporate gifting and activations.`,
  };
  return map[id] || "";
}

// ─── CONVERSATION ENGINE ──────────────────────────────────────────────────────

interface ConversationState {
  name: string;
  eventType: string | null;
  guestCount: string | null;
  preference: string | null;
  askedForEventClarification: boolean;
  askedForPaxClarification: boolean;
}

function buildConversationState(userMessages: string[]): ConversationState {
  const state: ConversationState = {
    name: "",
    eventType: null,
    guestCount: null,
    preference: null,
    askedForEventClarification: false,
    askedForPaxClarification: false,
  };

  // The FIRST user message is always the name
  if (userMessages.length >= 1) {
    state.name = cleanName(userMessages[0]);
  }

  // Scan remaining messages for valid answers (order-independent)
  for (let i = 1; i < userMessages.length; i++) {
    const msg = userMessages[i];
    if (!state.eventType) {
      const et = parseEventType(msg);
      if (et) {
        state.eventType = et;
        continue;
      }
      // If we haven't asked for clarification yet, flag it
      state.askedForEventClarification = true;
    } else if (!state.guestCount) {
      const gc = parseGuestCount(msg);
      if (gc) {
        state.guestCount = gc;
        continue;
      }
      state.askedForPaxClarification = true;
    } else if (!state.preference) {
      // preference is always free-form text — accept it
      if (msg.trim().length >= 2) {
        state.preference = msg.trim();
      }
    }
  }

  return state;
}

// ─── POST HANDLER ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let messages: { role: string; text: string }[] = [];
  let userMessages: string[] = [];

  try {
    const body = await req.json();
    messages = body.messages || [];
    userMessages = messages.filter((m) => m.role === "user").map((m) => m.text);

    // ── Try official Gemini REST API if valid key exists ──────────────────────
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (apiKey && apiKey.startsWith("AIzaSy")) {
      const contents = [
        { role: "user", parts: [{ text: DRUPITHA_PERSONA }] },
        { role: "model", parts: [{ text: "Understood! I'm Drupitha, a warm luxury event advisor at Visriva. I'll guide each customer step by step." }] },
        ...messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
      ];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.75, maxOutputTokens: 900 } }),
      });
      if (response.ok) {
        const data = await response.json();
        const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (rawText) {
          const trimmed = rawText.trim();
          const jsonMatch = trimmed.match(/\{[\s\S]*"mode"\s*:\s*"recommendation"[\s\S]*\}/);
          if (jsonMatch) {
            try { return NextResponse.json(JSON.parse(jsonMatch[0])); } catch {}
          }
          return NextResponse.json({ mode: "question", message: trimmed });
        }
      }
    }
  } catch (err: any) {
    console.warn("Concierge API warning:", err?.message);
  }

  // ── BUILT-IN CONVERSATIONAL ENGINE (no API key needed) ────────────────────
  if (userMessages.length === 0) {
    return NextResponse.json({
      mode: "question",
      message: "Hello! I'm Drupitha, your Visriva event advisor. 😊\n\nMay I know your name to get started?",
    });
  }

  const state = buildConversationState(userMessages);

  // STEP 1: We have their name, ask for event type
  if (!state.eventType) {
    // If this is their first message (name), ask for event
    if (userMessages.length === 1) {
      const greeting = state.name ? `, ${state.name}` : "";
      return NextResponse.json({
        mode: "question",
        message: `Lovely to meet you${greeting}! 😊\n\nWhat is the occasion for your upcoming celebration? (e.g. Wedding, Haldi & Sangeet, Corporate Gala, Birthday, Brand Activation...)`,
      });
    }
    // They gave an answer but it was gibberish — ask once more clearly
    return NextResponse.json({
      mode: "question",
      message: `I didn't quite catch that! 😊 Could you tell me which type of event you're planning?\n\n- 💒 Wedding or Engagement\n- 🌺 Haldi, Sangeet & Mehendi\n- 🎂 Birthday or Anniversary\n- 🏢 Corporate Gala or Launch\n- 🎪 Brand Activation or Fest\n- 🎉 Private Celebration`,
    });
  }

  // STEP 2: We have event type, ask for guest count
  if (!state.guestCount) {
    if (userMessages.length <= 2 || !state.askedForPaxClarification) {
      return NextResponse.json({
        mode: "question",
        message: `A **${state.eventType}** sounds wonderful${state.name ? `, ${state.name}` : ""}! 🎉\n\nApproximately how many guests are you expecting? (e.g. 100, 250, 500+)`,
      });
    }
    // Asked already, still no number
    return NextResponse.json({
      mode: "question",
      message: `No worries! Just a rough number works — are we looking at something like 50, 150, 300, or 500+ guests? 👥`,
    });
  }

  // STEP 3: We have event + guest count, ask for preference
  if (!state.preference) {
    return NextResponse.json({
      mode: "question",
      message: `Perfect! For your **${state.eventType}** with **~${state.guestCount} guests**...\n\nWhat matters most to you? 🎯\n\n- 📸 Fun interactive photo activities\n- 🎁 Custom take-home souvenir gifts\n- 🏢 Corporate branded gifting`,
    });
  }

  // STEP 4: All collected — give final recommendation
  return NextResponse.json(
    buildRecommendation(state.name, state.eventType, state.guestCount, state.preference)
  );
}
