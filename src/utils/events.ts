import { Types } from "ably";
import Ably from "ably/promises";
import { useEffect } from "react";
import { useRouter } from "next/router";

export enum GameEvent {
  JoinedLobby = "joinedLobby",
  NewRound = "NewRound"
}

export const useJoinLobby = (lobbyCode: string, onJoinedLobby: (playerName: string) => void) => {
  const callback = (message: Types.Message) => {
    onJoinedLobby(<string>message.data);
  };
  useEvent(lobbyCode, GameEvent.JoinedLobby, callback);
};

let counter = 0
export function useEvent(
  lobbyCode: string,
  eventName: string,
  callbackOnMessage: (message: Types.Message) => void
) {
  const useEffectHook = () => {
    const ably = new Ably.Realtime.Promise({
      authUrl: "/api/createTokenRequest",
    });

    const channel = ably.channels.get(<string>lobbyCode);
    console.log(`ABLY COUNTER: ${counter++})`);

    channel.subscribe(eventName, (msg) => {
      callbackOnMessage(msg);
    });
  
    return () => {
      channel.unsubscribe();
    };
  };

  useEffect(useEffectHook, []);
}
