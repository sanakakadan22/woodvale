import React, { useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { useRouter } from "next/router";
import confetti from "canvas-confetti";
import Image from "next/image";
import { useEvent } from "../../utils/events";
import { GameEvent } from "../../utils/enums";

const ScoreBoard: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const router = useRouter();
  const { data } = trpc.useQuery(["scores.get-by-code", { lobbyCode }]);
  const { mutate } = trpc.useMutation("scores.create-new-lobby", {
    onSuccess: (newLobbyCode) => {
      // router.push(`/lobby/${newLobbyCode}`);
    },
  });

  const channel = useEvent(lobbyCode, GameEvent.NewLobbyCreated, (message) => {
    channel.detach(() => router.push(`/lobby/${message.data}`));
  });

  const maxScore = data?.players[0]?.score || 0;

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        confetti({
          spread: 100,
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="grid place-items-center">
      <p className="text-4xl font-extrabold font-mono text-center m-4 ">
        And the Top Swiftie is...
      </p>
      <p className="text-4xl font-extrabold font-mono text-center m-2 text-primary">
        {data?.players[0]?.name}
      </p>
      <p className="text-lg italic m-2">you just won a grammy!</p>
      <Image
        className="mask mask-squircle float-left"
        src="/grammy.jpg"
        alt="TS Grammy"
        width={550}
        height={380}
      />

      <div className="card-body text-2xl bg-accent shadow-2xl p-3 m-2 text-center w-3/5">
        {data?.players.map((player, i) => (
          <PlayerScore
            maxScore={maxScore}
            player={player}
            key={i}></PlayerScore>
        ))}
      </div>
      <div className="btn-group m-10">
        <button
          className="btn btn-secondary"
          onClick={() => {
            mutate({ lobbyCode: lobbyCode });
          }}>
          Play again
        </button>
        <button className="btn">
          <a href={"/"}>Home</a>
        </button>
      </div>
    </div>
  );
};

const PlayerScore: React.FC<{
  player: { score: number; name: string };
  maxScore: number;
}> = ({ player, maxScore }) => {
  return (
    <div className="flex flex-row place-items-center w-100">
      <div className="w-1/5">{player.name}:</div>
      <progress
        className="progress progress-primary w-3/5 h-6 m-5"
        value={player.score}
        max={maxScore}
      />
      {player.score}
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
