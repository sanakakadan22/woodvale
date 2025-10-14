declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (config: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayer {
  addListener(
    event: "ready",
    callback: (data: { device_id: string }) => void
  ): void;
  addListener(
    event: "not_ready",
    callback: (data: { device_id: string }) => void
  ): void;
  connect(): Promise<boolean>;
  pause(): Promise<void>;
}

export {};
