const ACCESS_TOKEN = "EAAgAfLrp7MYBSCMiqeZCgsemJA0k3INeXJqR80Wq67DSqvZAKdLCZB0ufr8ldGNwNZAqf48KCdnpxDkVZAfI5N0M3MhRfGHw2RlY27aMWOAZCH5zZAGesVltsZCIxHgW34rNvZBlFA5ZCCfylpcbgTavPVzwEEaZAmrDbdr03C6z2oTSLUh4cWZAPZBgyjk1lt5hZCwwZDZD";
const PHONE_NUMBER_ID = "2176925779756822";
const TO_PHONE = "918884484828";

async function sendTestMessage() {
  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: TO_PHONE,
    type: "template",
    template: {
      name: "3p_direct_integration_test_template",
      language: { code: "en_US" }
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("RESPONSE_STATUS:", res.status);
    console.log("RESPONSE_DATA:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

sendTestMessage();
