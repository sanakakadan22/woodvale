import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useEffect, useState } from "react";
import { useEvent, useJoinLobby } from "../../utils/events";
import { GameEvent } from "../../utils/enums";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const LobbyContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const { data } = trpc.useQuery(["lobby.get-by-code", { lobbyCode }], {
    onSuccess: (data) => {
      if (data?.status == "inGame") {
        router.push(`/game/${lobbyCode}`);
      }
    },
  });

  const [players, setPlayers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [parent] = useAutoAnimate<HTMLUListElement>();

  const router = useRouter();
  const newRound = trpc.useMutation("game.newRound", {
    onSuccess: (data) => {
      router.push(`/game/${data.lobbyCode}`);
    },
  }).mutate;

  useEvent(lobbyCode, GameEvent.NewRound, () =>
    router.push(`/game/${lobbyCode}`)
  );
  useJoinLobby(lobbyCode, (playerName) =>
    setPlayers((players) => [...players, playerName])
  );

  useEffect(() => {
    if (data) {
      setPlayers(data.players.map((player) => player.name));
    }
  }, [data]);

  return (
    <div className="grid h-screen place-items-center">
      <div className="text-center place-items-center">
        <div className="card shadow-2xl flex flex-row bg-secondary p-3 overflow-visible">
          <p className="text-2xl text-center text-bold mr-2">
            Code: {data?.lobbyCode}
          </p>
          <div className="tooltip" data-tip={copied ? "copied" : "copy"}>
            <button
              className="btn btn-sm text-2xl"
              onClick={() => {
                navigator.clipboard.writeText(lobbyCode);
                setCopied(true);
              }}>
              {copied ? "💃" : "📋"}
            </button>
          </div>
        </div>
        <button
          className="btn btn-primary btn-lg m-5"
          onClick={() => {
            newRound({ lobbyCode: lobbyCode });
          }}>
          Start
        </button>
        <ul ref={parent}>
          {players.map((player, i) => (
            <li
              className="card-body text-2xl bg-accent shadow-2xl p-3 m-2 text-center"
              key={i}>
              {player}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const LobbyPage = () => {
  const { query } = useRouter();
  const { code } = query;

  if (!code || typeof code !== "string") {
    return <div>No Code</div>;
  }

  return <LobbyContent lobbyCode={code} />;
};

export default LobbyPage;
