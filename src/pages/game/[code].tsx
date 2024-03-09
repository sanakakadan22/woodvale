import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useEffect, useState } from "react";
import { useEvent } from "../../utils/events";
import { GameEvent } from "../../utils/enums";
import confetti from "canvas-confetti";
import autoAnimate from "@formkit/auto-animate";
import { useAtom } from "jotai";
import { nameAtom } from "../index";
import { PlayerNameInput } from "../../components/name_input";

enum AnswerColor {
  Neutral,
  Correct,
  Wrong,
}

const GameContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const [correct, setCorrect] = useState(AnswerColor.Neutral);
  const [selected, setSelected] = useState(-1);
  const [correctAnswer, setCorrectAnswer] = useState(-1);
  const [seconds, setSeconds] = useState(0);
  const [isDisabled, setDisabled] = useState(true);
  const [parent] = useAutoAnimate();

  const { data, refetch } = trpc.useQuery([
    "game.get-round-by-code",
    { lobbyCode },
  ]);

  useEffect(() => {
    if (!data) {
      return;
    }
    const round = data?.rounds[0];
    if (!round) {
      return;
    }
    const secondsLeft = data.secondsLeft;
    if (secondsLeft <= 0) {
      setDisabled(false);
      return;
    }

    setSeconds(Math.floor(secondsLeft));
    const interval = setInterval(() => {
      setSeconds((seconds) => seconds - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      refetch();
    }, secondsLeft * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [data, refetch]);

  const sendAnswer = trpc.useMutation("game.sendAnswer", {
    onSuccess: (data, variables) => {
      if (data.correct) {
        confetti();
        confetti({
          angle: 60,
          spread: 100,
          origin: { x: 0 },
        });
        // and launch a few from the right edge
        confetti({
          angle: 120,
          spread: 100,
          origin: { x: 1 },
        });
        setCorrect(AnswerColor.Correct);
      } else {
        setCorrect(AnswerColor.Wrong);
        setCorrectAnswer(data.correctAnswer);
      }
    },
  }).mutate;

  const newRound = trpc.useMutation("game.newRound", {
    onSuccess: (data) => {
      // newRoundCallBack();
    },
  }).mutate;

  const router = useRouter();
  const endGame = trpc.useMutation("game.endTheGame", {
    onSettled: (data) => {
      channel.detach(() => router.push(`/score/${lobbyCode}`));
    },
  }).mutate;

  const channel = useEvent(lobbyCode, GameEvent.EndGame, () =>
    channel.detach(() => router.push(`/score/${lobbyCode}`))
  );

  useEvent(lobbyCode, GameEvent.NewRoundReady, () => {
    setDisabled(false);
  });

  const newRoundCallBack = () => {
    refetch();
    setCorrect(AnswerColor.Neutral);
    setSelected(-1);
    setCorrectAnswer(-1);
    setDisabled(true);
  };

  useEvent(lobbyCode, GameEvent.NewRound, newRoundCallBack);

  const [name, setName] = useAtom(nameAtom);
  if (!name || !data?.joined) {
    return <PlayerNameInput lobbyCode={lobbyCode} />;
  }

  const round = data?.rounds[0];
  if (!round) {
    return null;
  }

  let color = "btn";
  if (AnswerColor.Correct === correct) {
    color = "btn-success";
  } else if (AnswerColor.Wrong === correct) {
    color = "btn-error";
  }

  return (
    <div className="grid h-screen place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <ul ref={parent} className="flex flex-row m-5">
          {data.players.map((player) => (
            <PlayerScore player={player} key={player.id}></PlayerScore>
          ))}
        </ul>
        <span className="countdown text-2xl sm:text-6xl font-mono">
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
                onClick={() => {
                  if (selected == -1) {
                    setSelected(i);
                    sendAnswer({ lobbyCode: lobbyCode, answer: i });
                  }
                }}>
                {choice.choice}
              </button>
            );
          })}
        </div>
        <button
          disabled={isDisabled}
          className="btn btn-secondary"
          onClick={() => {
            newRound({ lobbyCode: lobbyCode });
          }}>
          New Round
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            endGame({ lobbyCode: lobbyCode });
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

  return <GameContent lobbyCode={code} />;
};

export default GamePage;

const PlayerScore: React.FC<{
  player: { score: number; name: string; isMe: boolean };
}> = ({ player }) => {
  return (
    <div
      className={`card shadow-2xl p-2 ml-2 ${
        player.isMe ? "bg-fuchsia-300" : "bg-secondary"
      }`}>
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
