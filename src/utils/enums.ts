export enum GameEvent {
  JoinedLobby = "joinedLobby",
  NewRound = "NewRound",
  EndGame = "EndGame",
  PlayerAnswered = "PlayerAnswered",
  NewRoundReady = "NewRoundReady",
  NewLobbyCreated = "NewLobbyCreated",
}
export enum LeaderType {
  Daily = "Daily",
  Monthly = "Monthly",
  AllTime = "All Time",
}

export enum LobbyType {
  TTPD = "ttpd",
  Taylor = "taylor",
  Flags = "flags",
  Debut = "debut",
  Fearless = "fearless",
  Cats = "cats",
  Showgirl = "showgirl"
}

export function LobbyTypeToEmoji(lobbyType: LobbyType): string {
    return {
      [LobbyType.TTPD]: "🪶",
      [LobbyType.Taylor]: "💃",
      [LobbyType.Flags]: "🏴",
      [LobbyType.Debut]: "💚",
      [LobbyType.Fearless]: "🫶",
      [LobbyType.Cats]: "🐈",
      [LobbyType.Showgirl]: "❤️‍🔥",
    }[lobbyType];
}

export function LobbyTypeToAlbum(lobbyType: string): string | undefined {
  return {
    [LobbyType.TTPD]: "The Tortured Poets Department",
    [LobbyType.Debut]: "Taylor Swift",
    [LobbyType.Fearless]: "Fearless",
    [LobbyType.Cats]: "Cats",
    [LobbyType.Showgirl]: "The Life of a Showgirl",
  }[lobbyType];
}
