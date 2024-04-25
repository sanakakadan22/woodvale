import type { NextPage } from "next";
import { trpc } from "../../utils/trpc";
import React from "react";
import { useAtom } from "jotai";
import { lobbyTypeAtom } from "../index";
import { useRouter } from "next/router";

const medals = ["🥇", "🥈", "🥉"];
const Home: NextPage = () => {
  const [lobbyType, setLobbyType] = useAtom(lobbyTypeAtom);
  const router = useRouter();

  const leaders = trpc.useQuery([
    "scores.leaderboard",
    { lobbyType: lobbyType },
  ]);

  return (
    <div className="flex h-[calc(100dvh)] w-full flex-col place-items-center p-10">
      <div className="tooltip" data-tip={lobbyType}>
        <button
          className="btn btn-ghost btn-sm text-2xl"
          onClick={() => {
            if (lobbyType == "taylor") {
              setLobbyType("flags");
            } else if (lobbyType == "flags") {
              setLobbyType("ttpd");
            } else {
              setLobbyType("taylor");
            }
          }}>
          {lobbyType === "taylor" ? "💃" : lobbyType === "ttpd" ? "🪶" : "🏴󠁧󠁢󠁷󠁬󠁳󠁿"}
        </button>
      </div>
      <div className="grid grid-cols-3 grid-flow-row place-items-center text-center space-y-2 text-xl p-5">
        {leaders.data?.map((player, i) => (
          <>
            <span className="text-3xl" key={i}>
              {medals[i]}
            </span>
            <span key={i}>{player.name}</span>
            <span key={i + "score"}>{player.score}</span>
          </>
        ))}
      </div>
      <button
        className="btn mt-5"
        onClick={() => {
          router.push("/");
        }}>
        Home
      </button>
    </div>
  );
};

export default Home;
