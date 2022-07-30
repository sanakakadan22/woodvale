import lyrics from './lyrics.json'; 

const LyricMap = new Map(Object.entries(lyrics.reputation)) //.flatMap(value => Object.entries(value)));

// const LyricMap = new Map(Object.values(lyrics).flatMap(value => Object.entries(value)));

const getRandomIndex = (array: any[]) => Math.floor(Math.random() * array.length)

function getRandomValue<Type>(array: Type[] | undefined) {
    if (!array) {
        return
    }
   return array[Math.floor(Math.random() * array.length)]
}

export function makeQuestion(): [string, string[], number] {    
    const keys = [...LyricMap.keys()];
    const shuffled = keys.sort(() => 0.5 - Math.random());

    // Get sub-array of first n elements after shuffled
    let selected = shuffled.slice(0, 4);
    
    const answerIndex = getRandomIndex(selected);
    const answer = selected[answerIndex];
    const questionSong = LyricMap.get(answer)
    const question = getRandomValue(questionSong)?.lyric || '' // throw error instead?    

    return [question, selected, answerIndex]
}
