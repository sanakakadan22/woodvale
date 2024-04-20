import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useEffect, useState } from "react";
import { useEvent, useJoinLobby } from "../../utils/events";
import { GameEvent } from "../../utils/enums";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Image from "next/image";
import { nameAtom } from "../index";
import { useAtom } from "jotai";
import { PlayerNameInput } from "../../components/name_input";

const LobbyContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const [name, setName] = useAtom(nameAtom);

  const joinLobby = trpc.useMutation("lobby.join").mutate;
  const { data, refetch } = trpc.useQuery(
    ["lobby.get-by-code", { lobbyCode }],
    {
      onSuccess: (data) => {
        if (data?.status == "inGame") {
          router.push(`/game/${lobbyCode}`);
        }
        if (data?.status == "ended") {
          router.push(`/score/${lobbyCode}`);
        }
      },
    }
  );

  const [players, setPlayers] = useState<
    { name: string; id: number; isMe: boolean }[]
  >([]);
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

  if (!name || !data?.joined) {
    return <PlayerNameInput lobbyCode={lobbyCode} />;
  }

  return (
    <div className="grid h-[calc(100dvh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <p className="text-lg italic text-center">
          are you gonna lose the game of chance, what are the chances?
        </p>
        <Image
          className="mask mask-squircle float-left"
          src="/ttpd_tattoo.jpeg"
          alt="TS TTPD Tattoo"
          width={500}
          height={500}
        />
        <div className="card flex flex-row bg-secondary p-3 overflow-visible w-[fit-content] m-3">
          <p className="text-2xl text-center text-bold mr-2">
            Invite an Albatross
          </p>
          <div className="tooltip" data-tip={copied ? "copied" : "copy"}>
            <button
              className="btn btn-sm text-2xl"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
              }}>
              {copied ? "🦅" : "📋"}
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            newRound({ lobbyCode: lobbyCode });
          }}>
          Start
        </button>
        <ul ref={parent} className="space-y-2">
          {players.map((player) => (
            <div
              className={`card-body text-2xl ${
                player.isMe ? "bg-accent" : "bg-secondary"
              } rounded-md shadow-2xl p-3 text-center flex-row justify-center`}
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
