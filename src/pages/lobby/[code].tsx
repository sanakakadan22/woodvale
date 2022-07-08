import {useRouter} from "next/router";
import {trpc} from "../../utils/trpc";
import React from "react";

const LobbyContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
    const { data } = trpc.useQuery(["lobby.get-by-code", { lobbyCode }]);

    return <div>
        <ul>
            <p>{data ? data.players.map((player, i) => <li key={i}>{player.name}</li>) : null}</p>
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