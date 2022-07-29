import { Types } from "ably";
import { GameEvent } from "./enums";
import { configureAbly, useChannel } from "@ably-labs/react-hooks";
import { nanoid } from "nanoid";

export const useJoinLobby = (
  lobbyCode: string,
  onJoinedLobby: (playerName: string) => void
) => {
  const callback = (message: Types.Message) => {
    onJoinedLobby(<string>message.data);
  };
  useEvent(lobbyCode, GameEvent.JoinedLobby, callback);
};

configureAbly({
  authUrl: "/api/createTokenRequest",
  clientId: nanoid(9),
});

export function useEvent(
  lobbyCode: string,
  eventName: GameEvent,
  callbackOnMessage: (message: Types.Message) => void
) {
  useChannel(lobbyCode, eventName, callbackOnMessage);
}
