import type { NextPage } from "next";
import { trpc } from "../../utils/trpc";
import React from "react";
import { useAtom } from "jotai";
import { lobbyTypeAtom } from "../index";
import { useRouter } from "next/router";

const medals = ["🥇", "🥈", "🥉", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const Home: NextPage = () => {
  const [lobbyType, setLobbyType] = useAtom(lobbyTypeAtom);
  const router = useRouter();

  const leaders = trpc.useQuery([
    "scores.leaderboard",
    { lobbyType: lobbyType },
  ]);

  return (
    <div className="flex h-[calc(100dvh)] w-full flex-col place-items-center p-10 space-y-5">
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
      {leaders.data ? (
        <div className="grid grid-cols-3 grid-flow-row place-items-center text-center space-y-2 text-xl bg-secondary shadow-sm rounded-2xl p-5">
          {leaders.data.map((player, i) => (
            <>
              <span className={i < 3 ? `text-3xl` : "text-xl"} key={i}>
                {medals[i]}
              </span>
              <span key={i + "name"}>{player.name}</span>
              <span key={i + "score"}>{player.score}</span>
            </>
          ))}
        </div>
      ) : null}
      <button
        className="btn"
        onClick={() => {
          router.push("/");
        }}>
        Home
      </button>
    </div>
  );
};

export default Home;
