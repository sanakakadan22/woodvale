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

  const maxScore = data ? data.roundLength * data.numberOfRounds : 0;
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        confetti({
          spread: 100,
          colors: ["#A79F95", "#78716c", "#f0f0f0", "#1a1f2e", "#06405EFF"],
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="grid h-[calc(100dvh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <p className="text-4xl font-extrabold font-mono text-center ">
          And the most Tortured Poet is...
        </p>
        <p className="text-4xl font-extrabold font-mono text-center text-primary">
          {data?.players[0]?.name}
        </p>
        <p className="text-lg italic">
          You wish you could un-recall how you almost had it all
        </p>
        <Image
          className="mask mask-squircle float-left"
          src="/ttpd_grammy_2.jpg"
          alt="TS Grammy"
          width="430"
          height="430"
        />

        <div className="grid grid-flow-row grid-cols-6 place-items-center card-body text-2xl bg-accent shadow-sm rounded-2xl p-3 text-center w-5/6">
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
    </div>
  );
};

const PlayerScore: React.FC<{
  player: { score: number; name: string };
  maxScore: number;
}> = ({ player, maxScore }) => {
  return (
    <>
      <div className="col-span-2">{player.name}</div>
      <progress
        className="progress progress-primary col-span-3 h-6"
        value={player.score}
        max={maxScore}
      />
      {player.score}
    </>
  );
};

const ScoreBoardPage = () => {
  const { query } = useRouter();
  const { code } = query;

  if (!code || typeof code !== "string") {
    return null;
  }

  return <ScoreBoard lobbyCode={code} />;
};

export default ScoreBoardPage;
