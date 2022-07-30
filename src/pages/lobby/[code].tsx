import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import React, { useEffect, useState } from "react";
import { useEvent, useJoinLobby } from "../../utils/events";
import { GameEvent } from "../../utils/enums";

const LobbyContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
  const { data } = trpc.useQuery(["lobby.get-by-code", { lobbyCode }]);
  const [players, setPlayers] = useState<string[]>([]);

  const router = useRouter();
  const newRound = trpc.useMutation("game.newRound", {
    onSuccess: (data) => {
      router.push(`/game/${data.lobbyCode}`);
    },
  }).mutate;

  useEvent(lobbyCode, GameEvent.NewRound, () =>
    router.push(`/game/${lobbyCode}`)
  );
  useJoinLobby(lobbyCode, (playerName) =>
    setPlayers((players) => [...players, playerName])
  );

  useEffect(() => {
    if (data) {
      setPlayers(data.players.map((player) => player.name));
    }
  }, [data]);

  return (
    <div className="grid h-screen place-items-center">
      <div>
        {data?.lobbyCode}
        <ul>
          {players.map((player, i) => (
            <li key={i}>{player}</li>
          ))}
        </ul>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => {
          newRound({ lobbyCode: lobbyCode });
        }}>
        New Round
      </button>
    </div>
  );
};

const LobbyPage = () => {
  const { query } = useRouter();
  const { code } = query;

  if (!code || typeof code !== "string") {
    return <div>No Code</div>;
  }

  return <LobbyContent lobbyCode={code} />;
};

export default LobbyPage;
