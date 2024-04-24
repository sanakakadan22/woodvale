import { Types } from "ably";
import { GameEvent } from "./enums";
import { useChannel } from "ably/react";
import Ably from "ably/promises";

export const client = new Ably.Realtime.Promise({
  authUrl: `/api/createTokenRequest`,
});

export const useJoinLobby = (
  lobbyCode: string,
  onJoinedLobby: (playerName: string) => void
) => {
  const callback = (message: Types.Message) => {
    onJoinedLobby(<string>message.data);
  };
  useEvent(lobbyCode, GameEvent.JoinedLobby, callback);
};

export function useEvent(
  lobbyCode: string,
  eventName: GameEvent,
  callbackOnMessage: (message: Types.Message) => void
) {
  const { channel } = useChannel(lobbyCode, eventName, callbackOnMessage);
  return channel;
}
