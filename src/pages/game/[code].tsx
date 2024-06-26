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
  const [parent2] = useAutoAnimate();

  const [selected, setSelected] = useState(-1);
  const [correctAnswer, setCorrectAnswer] = useState(-1);
  const [score, setScore] = useState(-1);
  const [roundOver, setRoundOver] = useState(false);
  const correct = selected === correctAnswer;

  const [areYouSure, setAreYouSure] = useState(false);

  const { data, refetch, isFetched } = trpc.useQuery(
    ["game.get-round-by-code", { lobbyCode }],
    {
      refetchInterval: (data) => {
        if (data === undefined || data?.roundOver) {
          return false;
        }

        return data.secondsLeft * 1000;
      },
      onSuccess: (data) => {
        setSelected(data.selected);
        setCorrectAnswer(data.currentRound.answer);
        setRoundOver(data.roundOver);
        setScore(data.score);
      },
    }
  );

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

  const sendAnswer = trpc.useMutation("game.sendAnswer", {
    onSuccess: (response, request) => {
      setSelected(request.answer);
      setRoundOver(response.roundOver);
      setCorrectAnswer(response.correctAnswer);
      setScore(response.score);
    },
  });

  useEffect(() => {
    if (roundOver && correct) {
      confetti({
        origin: { y: 1.2 },
        spread: 100,
        startVelocity: 90,
        ticks: 100,
        colors: ["#A79F95", "#78716c", "#f0f0f0", "#1a1f2e", "#06405EFF"],
      });
      confetti({
        spread: 100,
        startVelocity: 90,
        origin: { x: 0.25, y: 1.2 },
        ticks: 100,
        colors: ["#A79F95", "#78716c", "#f0f0f0", "#1a1f2e", "#06405EFF"],
      });
      // and launch a few from the right edge
      confetti({
        spread: 100,
        startVelocity: 90,
        origin: { x: 0.75, y: 1.2 },
        ticks: 100,
        colors: ["#A79F95", "#78716c", "#f0f0f0", "#1a1f2e", "#06405EFF"],
      });
    }
  }, [selected, correct, roundOver]);

  const newRound = trpc.useMutation("game.newRound", {
    onMutate: () => {
      setRoundOver(false);
    },
  });

  const router = useRouter();
  const endGame = trpc.useMutation("game.endTheGame", {
    onSettled: (data) => {
      router.push(`/score/${lobbyCode}`);
    },
  });

  const restart = trpc.useMutation(["lobby.restart"], {
    onSuccess: (newLobbyCode, req) => {
      refetch();
      setAreYouSure(false);
    },
  });

  useEvent(lobbyCode, GameEvent.EndGame, () =>
    router.push(`/score/${lobbyCode}`)
  );
  useEvent(lobbyCode, GameEvent.NewRound, () => refetch());
  useEvent(lobbyCode, GameEvent.PlayerAnswered, () => refetch());
  useEvent(lobbyCode, GameEvent.JoinedLobby, () => refetch());

  useEffect(() => {
    if (areYouSure) {
      const timer = setTimeout(() => {
        setAreYouSure(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [areYouSure]);

  const { presenceData } = usePresence(lobbyCode);
  const playerPresence = useMemo(() => {
    const playerPresence = new Set<string>();
    for (const msg of presenceData) {
      if (msg.action === "absent" || msg.action === "leave") {
        continue;
      }
      playerPresence.add(msg.clientId);
    }
    return playerPresence;
  }, [presenceData]);

  const [name] = useAtom(nameAtom);
  if (!name || (isFetched && !data?.joined)) {
    return <PlayerNameInput lobbyCode={lobbyCode} />;
  }

  const round = data?.currentRound;
  if (!round) {
    return null;
  }

  let color = "btn-info animate-pulse";
  if (correctAnswer !== -1 && selected === correctAnswer) {
    color =
      score > 12
        ? "bg-success-gold hover:bg-success-gold glass"
        : "btn-success";
  } else if (correctAnswer !== -1 && selected !== correctAnswer) {
    color = "btn-error animate-shake";
  }

  const lastRound = data.totalRounds >= data.maxRounds;
  const gameOver = data.totalRounds >= data.maxRounds && roundOver;
  return (
    <div className="grid h-[calc(100dvh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <ul ref={parent2} className="flex flex-row">
          {Array.apply(null, Array(data.maxRounds)).map(function (_, i) {
            let bg = i < data.totalRounds ? "bg-primary" : "bg-secondary";
            let key = i;
            if (i + 1 === data.totalRounds) {
              bg = "bg-accent animate-heartbeat";
              key = -1;
            } else if (i + 1 > data.totalRounds) {
              key = i - 1;
            }
            return <li key={key} className={`card p-2 ml-2 ${bg}`}></li>;
          })}
        </ul>
        <ul
          ref={parent}
          className="flex flex-row max-w-[calc(100dvw)] overflow-auto">
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
        <h1
          className={` ${
            data?.lobbyType === "flags" ? "text-8xl" : "text-2xl sm:text-4xl"
          } p-5 text-center`}>
          {round.question}
        </h1>

        <div className="grid grid-cols-2 grid-rows-2">
          {round.choices.map((choice, i) => {
            let buttonColor = "btn";
            if (i === selected) {
              buttonColor = color;
            } else if (i === correctAnswer) {
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
          disabled={!roundOver}
          className="btn btn-primary"
          onClick={() => {
            if (!lastRound) {
              newRound.mutate({ lobbyCode: lobbyCode });
            }
          }}>
          {lastRound ? (gameOver ? "Game Over!" : "Last Round!") : "Next Round"}
        </button>
        {!areYouSure ? (
          <button
            className={`btn btn-secondary ${
              areYouSure ? "btn-error animate-pulse" : ""
            } `}
            disabled={!endGame.isIdle}
            onClick={() => {
              if (gameOver) {
                endGame.mutate({ lobbyCode: lobbyCode });
              } else {
                setAreYouSure(true);
              }
            }}>
            End Game
          </button>
        ) : (
          <div className="flex flex-row space-x-1">
            <button
              disabled={endGame.isLoading || restart.isLoading}
              className="btn btn-info animate-pulse"
              onClick={() => {
                restart.mutate({ lobbyCode: lobbyCode });
              }}>
              Restart💃🏼
            </button>
            <button
              disabled={endGame.isLoading || restart.isLoading}
              className="btn btn-error animate-pulse"
              onClick={() => {
                endGame.mutate({ lobbyCode: lobbyCode });
              }}>
              Really???
            </button>
          </div>
        )}
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
      className={`card min-w-fit p-2 ml-2 ${
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
