import lyrics from "./lyrics.json";
import flags from "./flags.json";
import { sampleSize } from "lodash";
import { LobbyType, LobbyTypeToAlbum } from "../../utils/enums";
import { TypeOf } from "zod";

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

  const lobbyAlbum = LobbyTypeToAlbum(lobbyType)
  if (lobbyAlbum !== undefined && lobbyAlbum in lyrics) {
    // @ts-ignore
    lyricKeys = Object.keys(lyrics[lobbyAlbum]);
  }

  const selected: any[] = sampleSize(lyricKeys, 4);
  const answerIndex = getRandomIndex(selected);
  const answer = selected[answerIndex];
  const questionSong = LyricMap.get(answer);
  const question = getRandomValue(questionSong)?.lyric || ""; // throw error instead?

  return [question, selected, answerIndex];
}
