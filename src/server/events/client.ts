// src/server/events/client.ts
import Ably from "ably/promises";
import { GameEvent } from "../../utils/enums";

const ably = new Ably.Rest(process.env.ABLY_API_KEY || "");

const publish = async (channel: string, event: string, message: any) => {
  await ably.channels.get(channel).publish(event, message);
};

export const events = {
  emitJoinedLobby: async (lobbyCode: string) => {
    await publish(lobbyCode, GameEvent.JoinedLobby, "");
  },
  newRound: async (lobbyCode: string) => {
    await publish(lobbyCode, GameEvent.NewRound, "");
  },
  endGame: async (lobbyCode: string) => {
    await publish(lobbyCode, GameEvent.EndGame, "");
  },
  playerAnswered: async (lobbyCode: string) => {
    await publish(lobbyCode, GameEvent.PlayerAnswered, "");
  },
  newLobbyCreated: async (lobbyCode: string, newLobbyCode: string) => {
    await publish(lobbyCode, GameEvent.NewLobbyCreated, newLobbyCode);
  },
};
