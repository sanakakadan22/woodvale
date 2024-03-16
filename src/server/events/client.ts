// src/server/events/client.ts
import Ably from "ably/promises";
import { GameEvent } from "../../utils/enums";

const ably = new Ably.Rest(process.env.ABLY_API_KEY || "");

const publish = (channel: string, event: string, message: any) => {
  ably.channels.get(channel).publish(event, message);
};

export const events = {
  emitJoinedLobby: (lobbyCode: string) => {
    publish(lobbyCode, GameEvent.JoinedLobby, "");
  },
  newRound: (lobbyCode: string) => {
    publish(lobbyCode, GameEvent.NewRound, "");
  },
  endGame: (lobbyCode: string) => {
    publish(lobbyCode, GameEvent.EndGame, "");
  },
  newRoundReady: (lobbyCode: string) => {
    publish(lobbyCode, GameEvent.NewRoundReady, "");
  },
  newLobbyCreated: (lobbyCode: string, newLobbyCode: string) => {
    publish(lobbyCode, GameEvent.NewLobbyCreated, newLobbyCode);
  },
};
