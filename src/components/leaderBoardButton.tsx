import React from "react";
import { useRouter } from "next/router";

export const LeaderBoardButton = () => {
  const router = useRouter();
  return (
    <div className="tooltip" data-tip="trophies">
      <button
        className="btn btn-ghost btn-sm text-2xl"
        onClick={() => {
          router.push("/leader");
        }}>
        🏆
      </button>
    </div>
  );
};
