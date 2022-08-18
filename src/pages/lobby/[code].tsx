import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useEffect, useState } from "react";
import { useEvent, useJoinLobby } from "../../utils/events";
import { GameEvent } from "../../utils/enums";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Image from "next/image";

const LobbyContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const { data, refetch } = trpc.useQuery(
    ["lobby.get-by-code", { lobbyCode }],
    {
      onSuccess: (data) => {
        if (data?.status == "inGame") {
          router.push(`/game/${lobbyCode}`);
        }
      },
    }
  );

  const [players, setPlayers] = useState<{ name: string; id: number }[]>([]);
  const [copied, setCopied] = useState(false);
  const [parent] = useAutoAnimate<HTMLUListElement>();

  const router = useRouter();
  const newRound = trpc.useMutation("game.newRound", {
    onSuccess: (data) => {
      // router.push(`/game/${data.lobbyCode}`);
    },
  }).mutate;

  const removePlayer = trpc.useMutation("lobby.remove-player-by-id", {
    onSuccess: (data) => {
      refetch();
    },
  }).mutate;

  const channel = useEvent(lobbyCode, GameEvent.NewRound, () => {
    channel.detach(() => router.push(`/game/${lobbyCode}`));
  });
  useJoinLobby(lobbyCode, (playerName) => refetch());

  useEffect(() => {
    if (data) {
      setPlayers([...data.players]);
    }
  }, [data]);

  return (
    <div className="grid h-screen place-items-center">
      <div className="grid justify-items-center">
        <p className="text-lg italic text-center m-2">
          ...are you ready for it?
        </p>
        <Image
          className="mask mask-squircle float-left m-2"
          src="/ready.jpeg"
          alt="TS 1989"
          width={600}
          height={400}
        />
        <div className="card flex flex-row bg-secondary p-3 overflow-visible w-[fit-content] m-3">
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
          {players.map((player) => (
            <div
              className="card-body text-2xl bg-accent rounded shadow-2xl p-3 m-2 text-center flex-row justify-center"
              key={player.id}>
              <p className="flex-grow">{player.name}</p>
              <button
                className="tooltip"
                data-tip="remove"
                onClick={() => {
                  removePlayer({ lobbyCode: lobbyCode, playerId: player.id });
                }}>
                ✖️
              </button>
            </div>
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
    return null;
  }

  return <LobbyContent lobbyCode={code} />;
};

export default LobbyPage;
