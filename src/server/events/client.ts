// src/server/events/client.ts
import { GameEvent } from "../../utils/enums";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const redisPublish = (lobbyCode: string, event: string, message: string) => {
  redis.publish(
    "game",
    JSON.stringify({
      lobbyCode: lobbyCode,
      event: event,
      message: message,
    })
  );
};

export const redisEvents = {
  emitJoinedLobby: (lobbyCode: string) => {
    redisPublish(lobbyCode, GameEvent.JoinedLobby, "");
  },
  newRound: (lobbyCode: string) => {
    redisPublish(lobbyCode, GameEvent.NewRound, "");
  },
  endGame: (lobbyCode: string) => {
    redisPublish(lobbyCode, GameEvent.EndGame, "");
  },
  newRoundReady: (lobbyCode: string) => {
    redisPublish(lobbyCode, GameEvent.NewRoundReady, "");
  },
  newLobbyCreated: (lobbyCode: string, newLobbyCode: string) => {
    redisPublish(lobbyCode, GameEvent.NewLobbyCreated, newLobbyCode);
  },
};
