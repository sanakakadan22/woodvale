import type { NextPage } from "next";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/router";
import React from "react";
import Image from "next/image";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";
import { LeaderBoardButton } from "../components/leaderBoardButton";
import { lobbyTypeAtom, LobbyTypeButton } from "../components/lobbyTypeButton";

export const nameAtom = atomWithStorage<string>("name", "");

const Home: NextPage = () => {
  const router = useRouter();

  const createLobby = trpc.useMutation("lobby.create", {
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobbyCode}`);
    },
  });

  const [lobbyType] = useAtom(lobbyTypeAtom);
  const [name, setName] = useAtom(nameAtom);

  return (
    <div className="grid h-[calc(100dvh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <div className="text-3xl font-extrabold font-mono text-center">
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
        <Image
          style={{
            width: "37svh",
            height: "auto",
          }}
          className="mask mask-squircle w-auto"
          src="/ttpd_face.jpeg"
          alt="TS TTPD"
          height={350}
          width={350}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLobby.mutate({ name: name, lobbyType: lobbyType });
          }}
          className="grid place-items-center space-y-5">
          <input
            type="text"
            value={name}
            maxLength={32}
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
        <LobbyTypeButton />
        <LeaderBoardButton />
      </div>
    </div>
  );
};

export default Home;
