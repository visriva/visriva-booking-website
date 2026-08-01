import { NextResponse } from "next/server";
import { getOperatorConfigServer } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const { name, phone, token, galleryUrl, templateName, templateLanguage, isMarketing, ttlSeconds } = await req.json();
    const opConfig = await getOperatorConfigServer();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    // Clean phone number (must include country code e.g. 918884484828)
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone; // Default to India country code
    }

    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "1203212472878765";
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

    const guestName = name ? name.trim() : "Valued Guest";
    const defaultMsgText = `✨ *Visriva Live Station* ✨\n\nHello ${guestName}! 👋\n\nYour live event souvenir photo is ready!\n\n🎫 *Token Number:* #${token || "001"}\n${galleryUrl ? `📸 *Digital Gallery:* ${galleryUrl}\n` : ""}\nThank you for celebrating with us! 📸✨\n_Visriva Live Station — Luxury Memories Instant Printed_`;

    const encodedMsg = encodeURIComponent(defaultMsgText);
    const fallbackWaUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    // ─── 1. META OFFICIAL CLOUD & MARKETING MESSAGES API DISPATCH ───
    if (ACCESS_TOKEN) {
      const endpoint = isMarketing ? "marketing_messages" : "messages";
      const metaUrl = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/${endpoint}`;

      const payload = templateName
        ? {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: templateLanguage || "en_US" },
            },
            ...(ttlSeconds ? { ttl: { duration: ttlSeconds } } : {}),
          }
        : {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "text",
            text: {
              preview_url: true,
              body: defaultMsgText,
            },
          };

      try {
        let metaRes = await fetch(metaUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // If free-form text message fails (e.g., 24-hr window restriction), retry with default 'hello_world' template
        if (!metaRes.ok && !templateName) {
          console.warn("Meta text message rejected (24-hr window requirement). Retrying with 'hello_world' template...");
          const fallbackPayload = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
              name: "hello_world",
              language: { code: "en_US" },
            },
          };
          metaRes = await fetch(metaUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(fallbackPayload),
          });
        }

        if (metaRes.ok) {
          const metaData = await metaRes.json();
          return NextResponse.json({
            success: true,
            provider: isMarketing ? "meta_marketing_messages_api" : "meta_cloud_api",
            endpoint: `/v20.0/${PHONE_NUMBER_ID}/${endpoint}`,
            data: metaData,
          });
        } else {
          const errText = await metaRes.text();
          console.warn(`Meta API rejected message (${metaRes.status}): ${errText}. Falling back to secondary engine.`);
          const isWindowExpired = errText.includes("131047") || errText.toLowerCase().includes("window") || errText.toLowerCase().includes("24 hours");
          if (isWindowExpired) {
            return NextResponse.json({
              success: false,
              isWindowExpired: true,
              fallbackWaUrl,
              error: "Meta 24-hour customer service window expired.",
              details: errText
            }, { status: 200 });
          }
        }
      } catch (metaErr: any) {
        console.warn("Meta API network connection issue. Falling back to secondary engine:", metaErr.message);
      }
    }

    // ─── 2. EVOLUTION API / SECONDARY DISPATCH ───────────────────────────────
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://api.visriva.com";
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey";
    const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "visriva-live";

    let evolutionSuccess = false;
    let evoData = null;

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: cleanPhone,
            options: {
              delay: 1200,
              presence: "composing",
            },
            textMessage: {
              text: defaultMsgText,
            },
          }),
        }
      );

      if (response.ok) {
        evoData = await response.json();
        evolutionSuccess = true;
      } else {
        console.warn(`Primary Evolution API responded with code ${response.status}. Attempting backup VPS failover...`);
      }
    } catch (evoErr: any) {
      console.warn("Primary Evolution API unavailable:", evoErr.message);
    }

    // ─── 2.5. BACKUP EVOLUTION VPS FAILOVER DISPATCH ─────────────────────────
    const BACKUP_EVOLUTION_API_URL = opConfig.backupEvoApiUrl || process.env.BACKUP_EVOLUTION_API_URL;
    const BACKUP_EVOLUTION_API_KEY = opConfig.backupEvoApiKey || process.env.BACKUP_EVOLUTION_API_KEY;
    const BACKUP_INSTANCE_NAME = opConfig.backupInstanceName || process.env.BACKUP_EVOLUTION_INSTANCE_NAME || INSTANCE_NAME;

    if (!evolutionSuccess && BACKUP_EVOLUTION_API_URL && BACKUP_EVOLUTION_API_KEY) {
      try {
        console.log(`🔌 Failover triggered: Routing traffic to backup Evolution VPS at ${BACKUP_EVOLUTION_API_URL}`);
        const backupResponse = await fetch(
          `${BACKUP_EVOLUTION_API_URL}/message/sendText/${BACKUP_INSTANCE_NAME}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: BACKUP_EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              number: cleanPhone,
              options: {
                delay: 1000,
                presence: "composing",
              },
              textMessage: {
                text: defaultMsgText,
              },
            }),
          }
        );

        if (backupResponse.ok) {
          evoData = await backupResponse.json();
          evolutionSuccess = true;
          return NextResponse.json({ 
            success: true, 
            provider: "evolution_api_failover", 
            data: evoData 
          });
        } else {
          console.warn(`Backup Evolution API failover rejected message with code ${backupResponse.status}`);
        }
      } catch (backupErr: any) {
        console.error("Backup Evolution API failover failed:", backupErr.message);
      }
    }

    if (evolutionSuccess) {
      return NextResponse.json({ success: true, provider: "evolution_api", data: evoData });
    }

    // ─── 3. FAILSAFE DIRECT WHATSAPP LINK FALLBACK ───────────────────────────
    // If both Meta Cloud API & Evolution API are unavailable or rejected, return 1-click wa.me link
    return NextResponse.json({
      success: true,
      provider: "wa_me_link_fallback",
      fallbackWaUrl,
      message: "Direct WhatsApp link generated. Click to send instantly.",
    });

  } catch (error: any) {
    console.error("Send WhatsApp Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
