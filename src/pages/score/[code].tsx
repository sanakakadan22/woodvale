import React, { useState } from "react";
import { trpc } from "../../utils/trpc";
import { Answer } from "@prisma/client";
import _ from "lodash";
import { useRouter } from "next/router";

const ScoreBoard: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const { data } = trpc.useQuery(["scores.get-by-code", { lobbyCode }]);

  return (
    <div>
      <div className="card-body text-2xl bg-accent shadow-2xl p-3 m-2 text-center">
        {data?.players.map((player, i) => (
          <PlayerScore player={player} key={i}></PlayerScore>
        ))}
      </div>
    </div>
  );
};

const PlayerScore: React.FC<{
  player: { answers: Answer[]; name: string };
}> = ({ player }) => {
  const score = _.sum(player.answers.map((answer) => answer.score));
  console.log(score);

  return (
    <div className="flex flex-row place-items-center w-100">
      <div className="w-1/5">{player.name}:</div>
      <progress
        className="progress progress-primary w-3/5 h-6 m-5"
        value={score}
        max="1300"
      />
      {score}
    </div>
  );
};

const ScoreBoardPage = () => {
  const { query } = useRouter();
  const { code } = query;

  if (!code || typeof code !== "string") {
    return <div>No Code</div>;
  }

  return <ScoreBoard lobbyCode={code} />;
};

export default ScoreBoardPage;
