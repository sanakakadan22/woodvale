import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useState } from "react";

enum Answer {
  Neutral,
  Correct,
  Wrong,
}

const GameContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const [correct, setCorrect] = useState(Answer.Neutral);
  const { data } = trpc.useQuery(["game.get-round-by-code", { lobbyCode }]);
  const round = data?.rounds.at(0);

  const sendAnswer = trpc.useMutation("game.sendAnswer", {
    onSuccess: (data) => {
      console.log(data);
      if (data.correct) {
        setCorrect(Answer.Correct);
      } else {
        setCorrect(Answer.Wrong);
      }
    },
  }).mutate;

  const newRound = trpc.useMutation("game.newRound", {
    onSuccess: (data) => {
      setCorrect(Answer.Neutral);
    },
  }).mutate;

  if (!round) {
    return null;
  }

  let color = "bg-gray-500";
  if (Answer.Correct === correct) {
    color = "bg-green-500";
  } else if (Answer.Wrong === correct) {
    color = "bg-red-600";
  }

  return (
    <div className="grid h-screen place-items-center">
      <h1 className="text-6xl">"{round.question}"</h1>
      <div className={`card shadow-2xl ${color} p-7`}>
        <div className="grid grid-cols-2 grid-rows-2">
          {round.choices.map((choice, i) => (
            <button
              className="btn btn-primary btn-lg m-2"
              key={i}
              onClick={() => {
                sendAnswer({ lobbyCode: lobbyCode, answer: i });
              }}>
              {choice.choice}
            </button>
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          newRound({ lobbyCode: lobbyCode });
        }}>
        New Round
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
