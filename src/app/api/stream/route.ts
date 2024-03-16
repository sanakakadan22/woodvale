// Can be 'nodejs', but Vercel recommends using 'edge'
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Prevents this route's response from being cached
export const dynamic = "force-dynamic";

// Use ioredis to subscribe
import Redis from "ioredis";

// Create a redis subscriber
const client = new Redis(process.env.UPSTASH_REDIS_URL ?? "");
client.subscribe("game", (err) => {});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lobbyCode = searchParams.get("lobbyCode");

  if (!lobbyCode) {
    return;
  }

  const encoder = new TextEncoder();
  // Create a stream

  let callback: {
    (channel: any, message: any): void;
  };

  const customReadable = new ReadableStream({
    start(controller) {
      callback = (channel, message) => {
        if (channel === "game" && JSON.parse(message).lobbyCode === lobbyCode) {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        }
      };
      client.addListener("message", callback);

      client.addListener("end", (channel, message) => {
        if (channel === lobbyCode) {
          controller.close();
        }
      });
    },
    cancel() {
      client.removeListener("message", callback);
    },
  });
  // Return the stream and try to keep the connection alive
  return new Response(customReadable, {
    // Set headers for Server-Sent Events (SSE) / stream from the server
    headers: {
      Connection: "keep-alive",
      "Content-Encoding": "none",
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
