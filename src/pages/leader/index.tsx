import type { NextPage } from "next";
import { trpc } from "../../utils/trpc";
import React, { useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/router";
import { LeaderType } from "../../utils/enums";
import { lobbyTypeAtom } from "../../components/lobbyTypeButton";

const medals = ["🥇", "🥈", "🥉", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const Home: NextPage = () => {
  const [lobbyType, setLobbyType] = useAtom(lobbyTypeAtom);
  const [leaderType, setLeaderType] = useState(LeaderType.Monthly);
  const router = useRouter();

  const leaders = trpc.useQuery([
    "scores.leaderboard",
    { lobbyType: lobbyType, type: leaderType },
  ]);

  return (
    <div className="flex h-[calc(100dvh)] w-full flex-col place-items-center p-10 space-y-5">
      <button
        className="btn btn-ghost btn-sm text-2xl tooltip"
        data-tip={lobbyType}
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
      <div role="tablist" className="tabs tabs-boxed">
        <a
          className={`tab ${
            leaderType === LeaderType.Daily ? "tab-active" : ""
          }`}
          onClick={() => {
            setLeaderType(LeaderType.Daily);
          }}>
          Today
        </a>
        <a
          className={`tab ${
            leaderType === LeaderType.Monthly ? "tab-active" : ""
          }`}
          onClick={() => {
            setLeaderType(LeaderType.Monthly);
          }}>
          {LeaderType.Monthly}
        </a>
        <a
          className={`tab ${
            leaderType === LeaderType.AllTime ? "tab-active" : ""
          }`}
          onClick={() => {
            setLeaderType(LeaderType.AllTime);
          }}>
          {LeaderType.AllTime}
        </a>
      </div>

      {leaders.data && leaders.data.length > 0 ? (
        <div className="grid grid-cols-3 grid-flow-row place-items-center text-center text-xl bg-secondary shadow-sm rounded-2xl p-5">
          {leaders.data.map((player, i) => (
            <>
              <span className={i < 3 ? "text-3xl" : "text-xl"} key={i}>
                {medals[i]}
              </span>
              <span key={i + "name"} className="p-2">
                {player.name}
              </span>
              <span key={i + "score"}>{player.score}</span>
            </>
          ))}
        </div>
      ) : null}
      <button
        className="btn"
        onClick={() => {
          router.back();
        }}>
        Back
      </button>
    </div>
  );
};

export default Home;
