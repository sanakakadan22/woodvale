import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GameEvent } from "../../utils/enums";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Image from "next/image";
import { nameAtom } from "../index";
import { useAtom } from "jotai";
import { PlayerNameInput } from "../../components/name_input";
import { AblyProvider, usePresence } from "ably/react";
import { client, useEvent, useJoinLobby } from "../../utils/events";

const LobbyContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const [name, setName] = useAtom(nameAtom);

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

  const [copied, setCopied] = useState(false);
  const [parent] = useAutoAnimate<HTMLUListElement>();

  const { presenceData } = usePresence(lobbyCode);
  const playerPresence = useMemo(() => {
    const playerPresence = new Set<string>();
    for (const msg of presenceData) {
      playerPresence.add(msg.clientId);
    }
    return playerPresence;
  }, [presenceData]);

  const router = useRouter();
  const newRound = trpc.useMutation("game.newRound", {
    onSuccess: (data) => {
      router.push(`/game/${lobbyCode}`);
    },
  });

  const removePlayer = trpc.useMutation("lobby.remove-player-by-id", {
    onSuccess: (data) => {
      refetch();
    },
  }).mutate;

  const channel = useEvent(lobbyCode, GameEvent.NewRound, () => {
    router.push(`/game/${lobbyCode}`);
  });
  useJoinLobby(lobbyCode, (playerName) => refetch());

  if (!name || !data?.joined) {
    return <PlayerNameInput lobbyCode={lobbyCode} />;
  }

  return (
    <div className="grid h-[calc(100svh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <p className="text-lg italic text-center">
          are you gonna lose the game of chance, what are the chances?
        </p>
        <div className="relative h-[calc(37vh)] w-[calc(37svh)]">
          <Image
            className="mask mask-squircle"
            src="/ttpd_tattoo.jpeg"
            alt="TS TTPD Tattoo"
            fill
          />
        </div>
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
          disabled={!newRound.isIdle}
          onClick={() => {
            newRound.mutate({ lobbyCode: lobbyCode });
          }}>
          Start
        </button>
        <ul ref={parent} className="space-y-2">
          {data?.players.map((player) => (
            <div
              className={`card-body text-2xl ${
                player.isMe ? "bg-accent" : "bg-secondary"
              } rounded-md shadow-2xl p-3 text-center flex-row justify-center ${
                playerPresence.size === 0 || playerPresence.has(player.presence)
                  ? ""
                  : "animate-pulse bg-warning"
              }`}
              key={player.id}>
              <p className="flex-grow">{player.name}</p>
              <button
                className="tooltip"
                data-tip="remove"
                onClick={() => {
                  removePlayer({ lobbyCode: lobbyCode, playerId: player.id });
                }}>
                ✖
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

  return (
    <AblyProvider client={client}>
      <LobbyContent lobbyCode={code} />
    </AblyProvider>
  );
};

export default LobbyPage;
