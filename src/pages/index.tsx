import type { NextPage } from "next";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/router";
import React from "react";
import Image from "next/image";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";

export const nameAtom = atomWithStorage<string>("name", "");
export const lobbyTypeAtom = atomWithStorage<"taylor" | "flags" | "ttpd">(
  "lobbyType",
  "ttpd",
  undefined,
  {
    getOnInit: true,
  }
);

const Home: NextPage = () => {
  const router = useRouter();

  const createLobby = trpc.useMutation("lobby.create", {
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobbyCode}`);
    },
  });

  const [lobbyType, setLobbyType] = useAtom(lobbyTypeAtom);
  const [name, setName] = useAtom(nameAtom);

  return (
    <div className="grid h-[calc(100dvh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <div className="text-4xl font-extrabold font-mono text-center">
          The{" "}
          <div className="tooltip tooltip-bottom" data-tip="Sana's GitHub">
            <a
              href="https://github.com/sanakakadan22"
              className="link link-hover link-primary">
              Woodvale
            </a>
          </div>{" "}
          Tortured Game Department
        </div>
        <p className="text-lg italic text-center">
          It&apos;s just a game, but really (Really)
        </p>
        <div className="relative h-[calc(37vh)] w-[calc(37svh)]">
          <Image
            className="mask mask-squircle"
            src="/ttpd_face.jpeg"
            alt="TS TTPD"
            fill
          />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLobby.mutate({ name: name, lobbyType: lobbyType });
          }}
          className="grid place-items-center space-y-5">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder={"Type name"}
            className="input input-bordered input-primary w-full"
          />

          <button
            className="btn btn-secondary w-1/2"
            disabled={!name || !createLobby.isIdle}
            type="submit">
            Host
          </button>
        </form>
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
        <div className="tooltip" data-tip="trophies">
          <button
            className="btn btn-ghost btn-sm text-2xl"
            onClick={() => {
              router.push("/leader");
            }}>
            🏆
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
