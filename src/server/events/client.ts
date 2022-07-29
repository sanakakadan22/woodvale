// src/server/events/client.ts
import Ably from "ably/promises";
import { GameEvent } from "../../utils/enums";

const ably = new Ably.Realtime(process.env.ABLY_API_KEY || "");

const publish = (channel: string, event: string, message: any) => {
  ably.channels.get(channel).publish(event, message);
};

export const events = {
  emitJoinedLobby: (lobbyCode: string, name: string) => {
    publish(lobbyCode, GameEvent.JoinedLobby, name);
  },
  newRound:  (lobbyCode: string) => {
    publish(lobbyCode,GameEvent.NewRound,'' )
  }
};
