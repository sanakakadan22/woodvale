import { Types } from "ably";
import { useRouter } from "next/router";
import { GameEvent } from "./enums";
import { configureAbly, useChannel } from "@ably-labs/react-hooks";
import { nanoid } from "nanoid";

export const useJoinLobby = (onJoinedLobby: (playerName: string) => void) => {
  const callback = (message: Types.Message) => {
    onJoinedLobby(<string>message.data);
  };
  useEvent(GameEvent.JoinedLobby, callback);
};

configureAbly({
  authUrl: "/api/createTokenRequest",
  clientId: nanoid(9),
});

function useEvent(
  eventName: GameEvent,
  callbackOnMessage: (message: Types.Message) => void
) {
  const { query } = useRouter();
  const { code } = query;

  useChannel(<string>code, eventName, callbackOnMessage);
}
