import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useEffect, useMemo, useState } from "react";
import { client, useEvent } from "../../utils/events";
import { GameEvent } from "../../utils/enums";
import confetti from "canvas-confetti";
import autoAnimate from "@formkit/auto-animate";
import { useAtom } from "jotai";
import { nameAtom } from "../index";
import { PlayerNameInput } from "../../components/name_input";
import { AblyProvider, usePresence } from "ably/react";

const GameContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  // const [correct, setCorrect] = useState(AnswerColor.Neutral);
  const [seconds, setSeconds] = useState(0);
  const [parent] = useAutoAnimate();

  const { data, refetch, isFetched } = trpc.useQuery(
    ["game.get-round-by-code", { lobbyCode }],
    {
      refetchInterval: (data) => {
        if (data === undefined || data?.roundOver) {
          return false;
        }

        return data.secondsLeft * 1000;
      },
    }
  );
  const selected = data?.selected ?? -1;
  const correctAnswer = data?.currentRound?.answer ?? -1;
  const correct = data?.correct ?? false;

  useEffect(() => {
    const secondsLeft = data?.secondsLeft ?? 0;

    const floorSecondsLeft = Math.floor(secondsLeft);
    if (floorSecondsLeft <= 0) {
      return;
    }

    setSeconds(floorSecondsLeft);
    const interval = setInterval(() => {
      setSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [data, refetch]);

  const utils = trpc.useContext();

  const sendAnswer = trpc.useMutation("game.sendAnswer", {
    onSuccess: (data, request) => {
      utils.setQueryData(
        ["game.get-round-by-code", { lobbyCode: lobbyCode }],
        // @ts-ignore
        (old) => {
          return {
            ...old,
            currentRound: {
              ...old?.currentRound,
              answer: data.correct ? request.answer : -1,
            },
            selected: request.answer,
            correct: data.correct,
          };
        }
      );
      if (data.correct) {
        confetti({
          colors: ["#A79F95", "#78716c", "#f0f0f0", "#1a1f2e", "#06405EFF"],
        });
        confetti({
          angle: 60,
          spread: 100,
          origin: { x: 0 },
          colors: ["#A79F95", "#78716c", "#f0f0f0", "#1a1f2e", "#06405EFF"],
        });
        // and launch a few from the right edge
        confetti({
          angle: 120,
          spread: 100,
          origin: { x: 1 },
          colors: ["#A79F95", "#78716c", "#f0f0f0", "#1a1f2e", "#06405EFF"],
        });
      }
    },
  });

  const newRound = trpc.useMutation("game.newRound", {
    onMutate: (data) => {
      utils.setQueryData(
        ["game.get-round-by-code", { lobbyCode: lobbyCode }],
        // @ts-ignore
        (old) => {
          return {
            ...old,
            roundOver: false,
          };
        }
      );
    },
  });

  const router = useRouter();
  const endGame = trpc.useMutation("game.endTheGame", {
    onSettled: (data) => {
      router.push(`/score/${lobbyCode}`);
    },
  });

  useEvent(lobbyCode, GameEvent.EndGame, () =>
    router.push(`/score/${lobbyCode}`)
  );
  useEvent(lobbyCode, GameEvent.NewRound, () => refetch());
  useEvent(lobbyCode, GameEvent.PlayerAnswered, () => refetch());

  const { presenceData } = usePresence(lobbyCode);
  const playerPresence = useMemo(() => {
    const playerPresence = new Set<string>();
    for (const msg of presenceData) {
      playerPresence.add(msg.clientId);
    }
    return playerPresence;
  }, [presenceData]);

  const [name, setName] = useAtom(nameAtom);
  if (!name || (isFetched && !data?.joined)) {
    return <PlayerNameInput lobbyCode={lobbyCode} />;
  }

  const round = data?.currentRound;
  if (!round) {
    return null;
  }

  let color = "btn";
  if (correct) {
    color = "btn-success";
  } else {
    color = "btn-error";
  }

  const gameOver = data.totalRounds >= data.maxRounds;
  return (
    <div className="grid h-[calc(100svh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <ul ref={parent} className="flex flex-row">
          {Array.apply(null, Array(data.maxRounds)).map(function (_, i) {
            let bg = i < data.totalRounds ? "bg-secondary" : "bg-primary";
            if (i + 1 === data.totalRounds) {
              bg = "bg-accent";
            }
            return (
              <li key={i} className={`card shadow-2xl p-2 ml-2 ${bg}`}></li>
            );
          })}
        </ul>
        <ul ref={parent} className="flex flex-row m-5">
          {data.players.map((player) => (
            <PlayerScore
              player={player}
              key={player.id}
              isPresent={
                playerPresence.size === 0 || playerPresence.has(player.presence)
              }
            />
          ))}
        </ul>
        <span
          className={`countdown text-2xl sm:text-6xl font-mono ${
            seconds < 7 ? "text-warning-content" : "text-neutral-content"
          } ${seconds <= 0 ? "animate-pulse" : ""}`}>
          <span style={{ "--value": seconds } as React.CSSProperties}></span>
        </span>
        <h1 className="text-2xl sm:text-6xl p-5 text-center">
          {round.question}
        </h1>

        <div className="grid grid-cols-2 grid-rows-2">
          {round.choices.map((choice, i) => {
            let buttonColor = "btn";
            if (i === selected) {
              buttonColor = color;
            } else if (i === correctAnswer) {
              buttonColor = "btn-warning";
            } else if (i === round.answer) {
              buttonColor = "btn-warning";
            }

            return (
              <button
                className={`btn ${buttonColor} btn-lg m-2 h-fit`}
                key={i}
                disabled={sendAnswer.isLoading}
                onClick={() => {
                  if (selected == -1) {
                    sendAnswer.mutate({ lobbyCode: lobbyCode, answer: i });
                  }
                }}>
                {choice.choice}
              </button>
            );
          })}
        </div>
        <button
          disabled={!data.roundOver || gameOver}
          className="btn btn-secondary"
          onClick={() => {
            newRound.mutate({ lobbyCode: lobbyCode });
          }}>
          {gameOver ? "Last Round!" : "Next Round"}
        </button>
        <button
          className="btn btn-primary"
          disabled={!endGame.isIdle}
          onClick={() => {
            endGame.mutate({ lobbyCode: lobbyCode });
          }}>
          End Game
        </button>
      </div>
    </div>
  );
};

const GamePage = () => {
  const { query } = useRouter();
  const { code } = query;

  if (!code || typeof code !== "string") {
    return null;
  }

  return (
    <AblyProvider client={client}>
      <GameContent lobbyCode={code} />
    </AblyProvider>
  );
};

export default GamePage;

const PlayerScore: React.FC<{
  isPresent: boolean;
  player: { score: number; name: string; isMe: boolean };
}> = ({ player, isPresent }) => {
  return (
    <div
      className={`card shadow-2xl p-2 ml-2 ${
        player.isMe ? "bg-accent" : "bg-secondary"
      } ${isPresent ? "" : "animate-pulse bg-warning"}`}>
      <p className="font-bold text-center">{player.name} </p>
      <span className="countdown justify-center">
        <span
          style={
            { "--value": Math.floor(player.score / 100) } as React.CSSProperties
          }></span>
        <span
          style={
            { "--value": player.score % 100 } as React.CSSProperties
          }></span>
      </span>
    </div>
  );
};

function useAutoAnimate<T extends HTMLElement>(options = {}) {
  const [element, setElement] = React.useState<T | null>(null);
  React.useEffect(() => {
    if (element instanceof HTMLElement) autoAnimate(element, options);
  }, [element, options]);
  return [setElement];
}
