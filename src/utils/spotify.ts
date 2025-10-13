const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  preview_url: string | null;
  duration_ms: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

export async function searchSpotifyTracks(
  query: string,
  accessToken: string,
  limit = 20
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: limit.toString(),
  });

  const response = await fetch(`${SPOTIFY_BASE_URL}/search?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = (await response.json()) as SpotifySearchResponse;
  return data.tracks.items;
}

export async function getTrack(
  trackId: string,
  accessToken: string
): Promise<SpotifyTrack> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  return (await response.json()) as SpotifyTrack;
}

export async function getArtistTopTracks(
  artistId: string,
  accessToken: string,
  market = "US"
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `${SPOTIFY_BASE_URL}/artists/${artistId}/top-tracks?market=${market}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = (await response.json()) as { tracks: SpotifyTrack[] };
  return data.tracks;
}

export async function getTaylorSwiftTracks(
  accessToken: string
): Promise<SpotifyTrack[]> {
  const taylorSwiftId = "06HL4z0CvFAxyc27GXpf02";
  return getArtistTopTracks(taylorSwiftId, accessToken);
}

export function hasPreviewUrl(track: SpotifyTrack): boolean {
  return track.preview_url !== null;
}

export function filterTracksWithPreview(
  tracks: SpotifyTrack[]
): SpotifyTrack[] {
  return tracks.filter((track) => hasPreviewUrl(track));
}
