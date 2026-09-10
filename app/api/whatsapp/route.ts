import { NextResponse } from "next/server";

const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "leap-coach-dev";
const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v25.0";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  console.log("Meta WhatsApp webhook event", {
    object: payload.object,
    entries: payload.entry?.length ?? 0
  });

  if (!message?.from) {
    return NextResponse.json({ received: true, sent: false });
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error("Missing Meta WhatsApp environment variables");
    return NextResponse.json({ received: true, sent: false }, { status: 500 });
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.from,
        type: "text",
        text: {
          body: "Leap Coach is connected. I will help you build a steady path to your first 21K."
        }
      })
    }
  );

  if (!response.ok) {
    console.error("Meta WhatsApp send failed", response.status);
    return NextResponse.json({ received: true, sent: false }, { status: 502 });
  }

  return NextResponse.json({ received: true, sent: true });
}
