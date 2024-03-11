import lyrics from "./lyrics.json";
import flags from "./flags.json";
import { LobbyType } from "../router/lobby";

// const LyricMap = new Map(Object.entries(lyrics.reputation)); // by album
const LyricMap = new Map(
  Object.values(lyrics).flatMap((value) => Object.entries(value))
);

const FlagMap = new Map<string, string>(Object.entries(flags));

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

  return makeTaylorQuestion();
}

function makeFlagQuestion(): [string, string[], number] {
  // @ts-ignore
  const keys = <string[]>[...FlagMap.keys()];
  const shuffled = keys.sort(() => 0.5 - Math.random());

  // Get sub-array of first n elements after shuffled
  let selected = shuffled.slice(0, 4);

  const answerIndex = getRandomIndex(selected);
  const question = selected[answerIndex] || "";
  const choices = selected.map((k) => FlagMap.get(k) || "");

  return [question, choices, answerIndex];
}

function makeTaylorQuestion(): [string, string[], number] {
  // @ts-ignore
  const keys = [...LyricMap.keys()];
  const shuffled = keys.sort(() => 0.5 - Math.random());

  // Get sub-array of first n elements after shuffled
  let selected = shuffled.slice(0, 4);

  const answerIndex = getRandomIndex(selected);
  const answer = selected[answerIndex];
  const questionSong = LyricMap.get(answer);
  const question = getRandomValue(questionSong)?.lyric || ""; // throw error instead?

  return [question, selected, answerIndex];
}
