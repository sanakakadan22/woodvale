import { GameEvent } from "./enums";
import { useEffect } from "react";

const connectToStream = (
  lobbyCode: string,
  callbacks: Map<GameEvent, (msg: any) => void>
) => {
  // Connect to /api/stream as the SSE API source
  const url = new URL("/api/stream", window.location.href);
  url.searchParams.append("lobbyCode", lobbyCode);
  const eventSource = new EventSource(url);

  eventSource.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    callbacks.get(data.event)?.(data.message);
  });

  eventSource.addEventListener("error", () => {
    eventSource.close();
    setTimeout(connectToStream, 1000);
  });
  return eventSource;
};

export function on(eventName: GameEvent, callback: (msg: any) => void) {
  return { eventName, callback };
}

export function useSubscribeLobby(
  lobbyCode: string,
  ...callbacks: { eventName: GameEvent; callback: (msg: any) => void }[]
) {
  useEffect(() => {
    const m = new Map<GameEvent, (msg: any) => void>();
    for (const { eventName, callback } of callbacks) {
      m.set(eventName, callback);
    }

    const eventSource = connectToStream(lobbyCode, m);
    return () => {
      eventSource.close();
    };
  }, []);
}
