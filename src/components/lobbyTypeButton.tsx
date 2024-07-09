import React from "react";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";
import { LobbyType, LobbyTypeToEmoji } from "../utils/enums";

export const lobbyTypeAtom = atomWithStorage<LobbyType>(
  "lobbyType",
  LobbyType.TTPD
);

const lobbyTypes = Object.values(LobbyType);

export const LobbyTypeButton = () => {
  const [lobbyType, setLobbyType] = useAtom(lobbyTypeAtom);

  const index = lobbyTypes.indexOf(lobbyType);

  return (
    <div className="tooltip" data-tip={lobbyType}>
      <button
        className="btn btn-ghost btn-sm text-2xl"
        onClick={() => {
          const nextLobbyType =
            lobbyTypes[(index + 1) % lobbyTypes.length] ?? lobbyType;
          setLobbyType(nextLobbyType);
        }}>
        {LobbyTypeToEmoji(lobbyType)}
      </button>
    </div>
  );
};
