import {useRouter} from "next/router";
import {trpc} from "../../utils/trpc";
import React, {useEffect, useState} from "react";
import {useJoinLobby} from "../../utils/events";

const LobbyContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
    const { data } = trpc.useQuery(["lobby.get-by-code", { lobbyCode }]);
    const [players, setPlayers] = useState<string[]>([])

    useJoinLobby(playerName => setPlayers([...players, playerName]))
    useEffect(() => {
        if (data) {
            setPlayers(data.players.map(player => player.name))
        }
    }, [data])

    return <div>
        {data?.lobbyCode}
        <ul>
            {players.map((player, i) => <li key={i}>{player}</li>)}
        </ul>
    </div>
}

const LobbyPage = () => {
    const { query } = useRouter();
    const { code } = query;

    if (!code || typeof code !== "string") {
        return <div>No Code</div>;
    }

    return <LobbyContent lobbyCode={code} />;
};

export default LobbyPage;