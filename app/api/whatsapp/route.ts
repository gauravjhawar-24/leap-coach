import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await request.formData();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Leap Coach is connected. I will help you build a steady path to your first 21K. Tell me: how long can you run comfortably today?</Message>
</Response>`;

  return new NextResponse(body, {
    headers: { "Content-Type": "text/xml" }
  });
}
