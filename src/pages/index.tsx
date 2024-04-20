import type { NextPage } from "next";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";

export const nameAtom = atomWithStorage<string>("name", "");

const Home: NextPage = () => {
  const router = useRouter();

  const createLobby = trpc.useMutation("lobby.create", {
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobbyCode}`);
    },
  });

  const joinLobby = trpc.useMutation("lobby.join", {
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobbyCode}`);
    },
  }).mutate;

  const [lobbyCode, setLobbyCode] = useState("");
  const [lobbyType, setLobbyType] = useState<"taylor" | "flags" | "ttpd">(
    "ttpd"
  );
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
        <Image
          className="mask mask-squircle"
          src="/ttpd_face.jpeg"
          alt="TS TTPD"
          width="350"
          height="350"
        />
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createLobby.mutate({ name: name, lobbyType: lobbyType });
            }}>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder={"Type name"}
              className="input input-bordered input-primary w-full"
            />

            <div className="btn-group w-full p-2">
              <button
                className="btn btn-secondary w-1/2"
                disabled={!name || !createLobby.isIdle}
                type="submit">
                Create
              </button>
              <button
                className="btn w-1/2"
                disabled={!lobbyCode || !name}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    joinLobby({
                      lobbyCode: lobbyCode,
                      name: name,
                    });
                  }
                }}
                onClick={() => {
                  joinLobby({
                    lobbyCode: lobbyCode,
                    name: name,
                  });
                }}>
                Join
              </button>
            </div>
          </form>
          <input
            value={lobbyCode}
            onChange={(e) => {
              setLobbyCode(e.target.value);
            }}
            type="text"
            placeholder={"Join lobby code"}
            className="input input-bordered w-full max-w-xs"
          />
        </div>
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
      </div>
    </div>
  );
};

export default Home;
