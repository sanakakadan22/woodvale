import React, { useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { useRouter } from "next/router";
import confetti from "canvas-confetti";
import Image from "next/image";
import { LeaderBoardButton } from "../../components/leaderBoardButton";
import {
  lobbyTypeAtom,
  LobbyTypeButton,
} from "../../components/lobbyTypeButton";
import { useAtom } from "jotai";

const ScoreBoard: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const router = useRouter();
  const { data } = trpc.useQuery(["scores.get-by-code", { lobbyCode }]);

  const [lobbyType] = useAtom(lobbyTypeAtom);
  const playAgain = trpc.useMutation("scores.create-new-lobby", {
    onSuccess: (newLobbyCode) => {
      router.push(`/lobby/${newLobbyCode}`);
    },
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
        <p className="text-3xl font-extrabold font-mono text-center ">
          And the most Tortured Poet is...
        </p>
        <p className="text-3xl font-extrabold font-mono text-center text-primary">
          {data?.players[0]?.name}
        </p>
        <p className="text-lg text-center italic">
          You wish you could un-recall how you almost had it all
        </p>
        <Image
          style={{
            width: "37svh",
            height: "auto",
          }}
          className="mask mask-squircle w-auto"
          src="/ttpd_grammy_2.jpg"
          alt="TS Grammy"
          height={350}
          width={350}
        />
        <div className="grid grid-flow-row grid-cols-6 place-items-center card-body text-2xl bg-secondary shadow-sm rounded-2xl p-3 text-center w-5/6">
          {data?.players.map((player, i) => (
            <PlayerScore
              maxScore={maxScore}
              player={player}
              key={i}></PlayerScore>
          ))}
        </div>
        <div className="join">
          <button
            className="btn btn-accent join-item"
            disabled={!playAgain.isIdle}
            onClick={() => {
              playAgain.mutate({ lobbyCode: lobbyCode, lobbyType: lobbyType });
            }}>
            Play Again
          </button>
          <button
            className="btn btn-secondary join-item"
            onClick={() => {
              router.push("/");
            }}>
            Home
          </button>
        </div>
        <LobbyTypeButton />
        <LeaderBoardButton />
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
