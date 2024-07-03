import React from "react";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";

export const lobbyTypeAtom = atomWithStorage<
  "taylor" | "flags" | "ttpd" | "debut"
>("lobbyType", "ttpd");

export const LobbyTypeButton = () => {
  const [lobbyType, setLobbyType] = useAtom(lobbyTypeAtom);

  return (
    <div className="tooltip" data-tip={lobbyType}>
      <button
        className="btn btn-ghost btn-sm text-2xl"
        onClick={() => {
          if (lobbyType == "taylor") {
            setLobbyType("flags");
          } else if (lobbyType == "flags") {
            setLobbyType("ttpd");
          } else if (lobbyType == "ttpd") {
            setLobbyType("debut");
          } else {
            setLobbyType("taylor");
          }
        }}>
        {lobbyType === "taylor"
          ? "💃"
          : lobbyType === "ttpd"
          ? "🪶"
          : lobbyType === "flags"
          ? "🏴󠁧󠁢󠁷󠁬󠁳󠁿"
          : "💚"}
      </button>
    </div>
  );
};
