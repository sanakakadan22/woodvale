import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useState } from "react";
import { GameEvent, useEvent } from "../../utils/events";
import { Answer, Player } from "@prisma/client";
import _ from "lodash";

enum AnswerColor {
  Neutral,
  Correct,
  Wrong,
}

const GameContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const [correct, setCorrect] = useState(AnswerColor.Neutral);
  const { data, refetch } = trpc.useQuery(["game.get-round-by-code", { lobbyCode }]);
  const round = data?.rounds[0];

  const sendAnswer = trpc.useMutation("game.sendAnswer", {
    onSuccess: (data) => {
      console.log(data);
      if (data.correct) {
        setCorrect(AnswerColor.Correct);
      } else {
        setCorrect(AnswerColor.Wrong);
      }
    },
  }).mutate;

  const newRound = trpc.useMutation("game.newRound", {
    onSuccess: (data) => {
      // newRoundCallBack()
    },
  }).mutate;

  const newRoundCallBack = () => {
    refetch()
    setCorrect(AnswerColor.Neutral);
  }

  useEvent(lobbyCode, GameEvent.NewRound, newRoundCallBack)

  if (!round) {
    return null;
  }

  let color = "bg-gray-500";
  if (AnswerColor.Correct === correct) {
    color = "bg-green-500";
  } else if (AnswerColor.Wrong === correct) {
    color = "bg-red-600";
  }

  const p = data.players[0]

  return (
    <div className="grid h-screen place-items-center">
      {data.players.map((player, i) => (
        <PlayerScore player={player} key={i}></PlayerScore>
      ))}
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


const PlayerScore: React.FC<{ player: {answers: Answer[]; name: string;} }> = ({ player }) => {
  const score = _.sum(player.answers.map(answer => answer.score))
  
  return(
    <div>
      {player.name}:{score}
    </div>
  )
}
