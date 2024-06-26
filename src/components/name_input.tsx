import React from "react";
import { trpc } from "../utils/trpc";
import { useAtom } from "jotai";
import { nameAtom } from "../pages";

export const PlayerNameInput: React.FC<{
  lobbyCode: string;
}> = ({ lobbyCode }) => {
  const joinLobby = trpc.useMutation("lobby.join");
  const [name, setName] = useAtom(nameAtom);

  return (
    <div className="grid h-[calc(100dvh)] w-full place-items-center">
      <form
        className="grid grid-flow-row-dense place-items-center space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          joinLobby.mutate({ lobbyCode: lobbyCode, name: name });
        }}>
        <input
          type="text"
          value={name}
          maxLength={32}
          onChange={(e) => {
            setName(e.target.value);
          }}
          placeholder={"Type name"}
          className="input input-bordered input-primary w-100"
        />
        <button
          className="btn btn-secondary w-1/2"
          disabled={!name || joinLobby.isLoading}
          type="submit">
          Join
        </button>
      </form>
    </div>
  );
};
