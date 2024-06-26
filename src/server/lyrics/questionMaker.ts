import lyrics from "./lyrics.json";
import ttpd from "./ttpd.json";
import flags from "./flags.json";
import { LobbyType } from "../router/lobby";
import { sampleSize } from "lodash";

// const LyricMap = new Map(Object.entries(lyrics.reputation)); // by album
const TTPDMap = new Map(
  Object.values(ttpd).flatMap((value) => Object.entries(value))
);
const TTPDKeys = [...TTPDMap.keys()];

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
  } else if (lobbyType === LobbyType.TTPD) {
    return makeTTPDQuestion();
  }

  return makeTaylorQuestion();
}

function makeFlagQuestion(): [string, string[], number] {
  const selected: any[] = sampleSize(FlagKeys, 4);
  const answerIndex = getRandomIndex(selected);
  const question = selected[answerIndex] || "";
  const choices = selected.map((k) => FlagMap.get(k) || "");

  return [question, choices, answerIndex];
}

function makeTTPDQuestion(): [string, string[], number] {
  const selected: any[] = sampleSize(TTPDKeys, 4);
  const answerIndex = getRandomIndex(selected);
  const answer = selected[answerIndex];
  const questionSong = LyricMap.get(answer);
  const question = getRandomValue(questionSong)?.lyric || ""; // throw error instead?

  return [question, selected, answerIndex];
}

function makeTaylorQuestion(): [string, string[], number] {
  const selected: any[] = sampleSize(LyricKeys, 4);
  const answerIndex = getRandomIndex(selected);
  const answer = selected[answerIndex];
  const questionSong = LyricMap.get(answer);
  const question = getRandomValue(questionSong)?.lyric || ""; // throw error instead?

  return [question, selected, answerIndex];
}
