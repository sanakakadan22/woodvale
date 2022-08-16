import type { NextPage } from "next";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { useRef, useState } from "react";
import Image from "next/image";

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

  const joinElement = useRef<HTMLInputElement>(null);
  const [cookies, setCookie] = useCookies(["name"]);
  const [name, setName] = useState(cookies.name);

  return (
    <div className="grid h-screen place-items-center">
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
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setCookie("name", e.target.value, { sameSite: "strict" });
            setName(e.target.value);
          }}
          placeholder={"Type name"}
          className="input input-bordered w-full max-w-xs"
        />

        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={() => {
              createLobby();
            }}>
            Create
          </button>
          <button
            className="btn"
            onClick={() => {
              if (!joinElement.current?.value) {
                return;
              }
              joinLobby({
                lobbyCode: joinElement.current.value,
              });
            }}>
            Join
          </button>
        </div>
        <input
          ref={joinElement}
          type="text"
          placeholder={"Join lobby code"}
          className="input input-bordered w-full max-w-xs"
        />
      </div>
    </div>
  );
};

export default Home;
