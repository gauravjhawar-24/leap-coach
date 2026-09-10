import { NextResponse } from "next/server";

const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "leap-coach-dev";

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

  console.log("Meta WhatsApp webhook event", {
    object: payload.object,
    entries: payload.entry?.length ?? 0
  });

  return NextResponse.json({ received: true });
}

