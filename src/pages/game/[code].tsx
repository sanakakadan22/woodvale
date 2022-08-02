import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useState } from "react";
import { useEvent } from "../../utils/events";
import { Answer, Player } from "@prisma/client";
import _ from "lodash";
import { GameEvent } from "../../utils/enums";

enum AnswerColor {
  Neutral,
  Correct,
  Wrong,
}

const GameContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const [correct, setCorrect] = useState(AnswerColor.Neutral);
  const [selected, setSelected] = useState(-1);
  const [correctAnswer, setCorrectAnswer] = useState(-1);

  const { data, refetch } = trpc.useQuery([
    "game.get-round-by-code",
    { lobbyCode },
  ]);
  const round = data?.rounds[0];

  const sendAnswer = trpc.useMutation("game.sendAnswer", {
    onSuccess: (data, variables) => {
      console.log(data);
      setSelected(variables.answer);
      if (data.correct) {
        setCorrect(AnswerColor.Correct);
      } else {
        setCorrect(AnswerColor.Wrong);   
        setCorrectAnswer(data.correctAnswer)
      
      }
    },
  }).mutate;

  const newRound = trpc.useMutation("game.newRound", {
    onSuccess: (data) => {
      newRoundCallBack();
    },
  }).mutate;

  const newRoundCallBack = () => {
    refetch();
    setCorrect(AnswerColor.Neutral);
    setSelected(-1);
    setCorrectAnswer(-1);
  };

  useEvent(lobbyCode, GameEvent.NewRound, newRoundCallBack);

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
    <div className="grid h-screen place-items-center">
      {data.players.map((player, i) => (
        <PlayerScore player={player} key={i}></PlayerScore>
      ))}
      <h1 className="text-6xl">"{round.question}"</h1>
      {/*<div className={`card shadow-2xl ${color} p-7`}>*/}
      <div className="grid grid-cols-2 grid-rows-2">
        {round.choices.map((choice, i) => {
          let buttonColor = "btn-primary";
          if (i === selected) {
            buttonColor = color;
          } if ( i === correctAnswer){
            buttonColor = "btn-success"
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
      {/*</div>*/}
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

const PlayerScore: React.FC<{
  player: { answers: Answer[]; name: string };
}> = ({ player }) => {
  const score = _.sum(player.answers.map((answer) => answer.score));

  return (
    <div>
      {player.name}:{score}
    </div>
  );
};
