import lyrics from "./lyrics.json";
import flags from "./flags.json";
import { LobbyType } from "../router/lobby";
import { sampleSize } from "lodash";

const LyricMap = new Map(
  Object.values(lyrics).flatMap((value) => Object.entries(value))
);
const LyricKeys = [...LyricMap.keys()];

const FlagMap = new Map<string, string>(Object.entries(flags));
const FlagKeys = [...FlagMap.keys()];

const getRandomIndex = (array: any[]) =>
  Math.floor(Math.random() * array.length);

function getRandomValue<Type>(array: Type[] | undefined) {
  if (!array) {
    return;
  }
  return array[Math.floor(Math.random() * array.length)];
}

export function makeQuestion(lobbyType: string) {
  if (lobbyType === LobbyType.Flags) {
    return makeFlagQuestion();
  } 

  return makeTaylorQuestion(lobbyType);
}

function makeFlagQuestion(): [string, string[], number] {
  const selected: any[] = sampleSize(FlagKeys, 4);
  const answerIndex = getRandomIndex(selected);
  const question = selected[answerIndex] || "";
  const choices = selected.map((k) => FlagMap.get(k) || "");

  return [question, choices, answerIndex];
}

function makeTaylorQuestion(lobbyType: string): [string, string[], number] {
  let lyricKeys: string[] = LyricKeys
  switch (lobbyType) {
    case LobbyType.TTPD:
      lyricKeys = Object.keys(lyrics["The Tortured Poets Department"]);
      break;
    case LobbyType.Fearless:
      lyricKeys = Object.keys(lyrics["Fearless"]);
      break;
    case LobbyType.Debut:
      lyricKeys = Object.keys(lyrics["Taylor Swift"])
      break;
  }

  const selected: any[] = sampleSize(lyricKeys, 4);
  const answerIndex = getRandomIndex(selected);
  const answer = selected[answerIndex];
  const questionSong = LyricMap.get(answer);
  const question = getRandomValue(questionSong)?.lyric || ""; // throw error instead?

  return [question, selected, answerIndex];
}
