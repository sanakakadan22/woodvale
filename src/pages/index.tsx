import type { NextPage } from "next";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
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
  }).mutate;

  const joinLobby = trpc.useMutation("lobby.join", {
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobbyCode}`);
    },
  }).mutate;

  const [lobbyCode, setLobbyCode] = useState("");
  const [name, setName] = useAtom(nameAtom);

  return (
    <div className="grid h-[calc(100dvh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <div className="text-4xl font-extrabold font-mono text-center">
          Welcome to{" "}
          <div className="tooltip tooltip-bottom" data-tip="Sana's GitHub">
            <a
              href="https://github.com/sanakakadan22"
              className="link link-hover link-primary">
              Sana
            </a>
          </div>
          &apos;s Swiftie Game hub
        </div>
        <p className="text-lg italic text-center">let the games begin...</p>
        <Image
          className="mask mask-squircle float-left"
          src="/homepage.jpeg"
          alt="TS 1989"
          width={650}
          height={430}
        />
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createLobby({ name });
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
                disabled={!name}
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
      </div>
    </div>
  );
};

export default Home;
