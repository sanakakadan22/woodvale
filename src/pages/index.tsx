import type { NextPage } from "next";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/router";
import React from "react";
import Image from "next/image";
import { useAtom } from "jotai";
import { LeaderBoardButton } from "../components/leaderBoardButton";
import { lobbyTypeAtom, LobbyTypeButton } from "../components/lobbyTypeButton";
import { SpotifyAuthButton } from "../components/spotifyAuthButton";
import { SpotifyDevicePicker } from "../components/spotifyDevicePicker";
import { nameAtom } from "../utils/atoms";
import { useSpotifyPlayer } from "../utils/spotify";

const Home: NextPage = () => {
  const router = useRouter();

  const createLobby = trpc.useMutation("lobby.create", {
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobbyCode}`);
    },
  });

  const [lobbyType] = useAtom(lobbyTypeAtom);
  const [name, setName] = useAtom(nameAtom);
  useSpotifyPlayer()

  return (
    <div className="grid h-[calc(100dvh)] w-full place-items-center">
      <div className="grid grid-flow-row-dense place-items-center space-y-5">
        <div className="text-3xl font-extrabold font-mono text-center">
          The Life of a{" "}
          <div className="tooltip tooltip-bottom" data-tip="Sana's GitHub">
            <a
              href="https://github.com/sanakakadan22"
              className="link link-hover woodvale-text">
              Woodvale
            </a>
          </div>{" "}
          Show Game
        </div>
        <p className="text-lg italic text-center">
          And, baby, that&apos;s show business for you!
        </p>
        <Image
          style={{
            width: "37svh",
            height: "auto",
          }}
          className="mask mask-squircle w-auto"
          src="/tl_home.JPG"
          alt="TL Home"
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
        <div className="pt-4 border-t border-base-300 flex flex-col items-center gap-3">
          <SpotifyDevicePicker />
          <SpotifyAuthButton />
        </div>
      </div>
    </div>
  );
};

export default Home;
