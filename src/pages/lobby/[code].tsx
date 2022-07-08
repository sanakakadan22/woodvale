import {useRouter} from "next/router";
import {trpc} from "../../utils/trpc";
import React from "react";

const LobbyContent: React.FC<{ lobbyCode: string }> = ({ lobbyCode }) => {
    const { data } = trpc.useQuery(["lobby.get-by-code", { lobbyCode }]);

    return <div>
        <p>{data ? data.lobbyCode : 'Loading Lobby...'}</p>
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