import { Types } from "ably";
import Ably from "ably/promises";
import {useEffect} from 'react'
import {useRouter} from "next/router";

export enum GameEvent {
    JoinedLobby = 'joinedLobby',
}

export const useJoinLobby = (onJoinedLobby: (playerName: string) => void) => {
    const callback = (message: Types.Message) => { onJoinedLobby(<string>message.data)}
    useEvent(GameEvent.JoinedLobby, callback)
}

const events = new Ably.Realtime.Promise({authUrl: '/api/createTokenRequest'});

function useEvent(eventName: string, callbackOnMessage: (message: Types.Message) => void) {
    const { query } = useRouter();
    const { id } = query;

    const useEffectHook = () => {
        if (!id || typeof id !== 'string') {
            return
        }

        const channel = events.channels.get(<string>id);
        channel.subscribe(eventName, msg => {
            console.log(msg)
            callbackOnMessage(msg);
        });
        return () => { channel.unsubscribe(); };
    };

    useEffect(useEffectHook);
}