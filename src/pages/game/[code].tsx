import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useEffect, useState } from "react";
import { useEvent } from "../../utils/events";
import { GameEvent } from "../../utils/enums";
import confetti from "canvas-confetti";
import autoAnimate from "@formkit/auto-animate";

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
    const secondsLeft =
      data.roundLength - (Date.now() - round.createdAt.getTime()) / 1000;

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
      setSelected(variables.answer);
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
      router.push(`/score/${lobbyCode}`);
    },
  }).mutate;

  useEvent(lobbyCode, GameEvent.EndGame, () =>
    router.push(`/score/${lobbyCode}`)
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

  const round = data?.rounds[0];
  if (!round) {
    return null;
  }

  let color = "btn-primary";
  if (AnswerColor.Correct === correct) {
    color = "btn-success";
  } else if (AnswerColor.Wrong === correct) {
    color = "btn-error";
  }

  return (
    <div className="grid place-items-center">
      <ul ref={parent} className="flex flex-row m-5">
        {data.players.map((player) => (
          <PlayerScore player={player} key={player.id}></PlayerScore>
        ))}
      </ul>
      <span className="countdown text-6xl font-mono p-5">
        <span style={{ "--value": seconds } as React.CSSProperties}></span>
      </span>
      <h1 className="text-6xl p-5 text-center">{round.question}</h1>

      {/*<div className={`card shadow-2xl ${color} p-7`}>*/}
      <div className="grid grid-cols-2 grid-rows-2 p-5">
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
              className={`btn ${buttonColor} btn-lg m-2`}
              key={i}
              onClick={() => {
                sendAnswer({ lobbyCode: lobbyCode, answer: i });
              }}>
              {choice.choice}
            </button>
          );
        })}
      </div>
      <button
        disabled={isDisabled}
        className="btn btn-secondary mb-5"
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
  );
};

const GamePage = () => {
  const { query } = useRouter();
  const { code } = query;

  if (!code || typeof code !== "string") {
    return <div>No Code</div>;
  }

  return <GameContent lobbyCode={code} />;
};

export default GamePage;

const PlayerScore: React.FC<{
  player: { score: number; name: string };
}> = ({ player }) => {
  return (
    <div className="card shadow-2xl p-2 ml-2 bg-secondary">
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
