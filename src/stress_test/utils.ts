import {FibonacciBackoff} from 'simple-backoff'

export function mergeStringToNumberMaps(...maps: Map<string, number>[]): Map<string, number> {
  const [headMap, ...tailMaps] = maps
  return tailMaps.reduce((mergedMap: Map<string, number>, mapToMerge: Map<string, number>) => {
    for (const [key, value] of mapToMerge) {
      if (mergedMap.has(key)) {
        mergedMap.set(key, mergedMap.get(key)! + mapToMerge.get(key)!)
      } else {
        mergedMap.set(key, value)
      }
    }
    return mergedMap
  }, new Map<string, number>(headMap))
}

export async function backoffedPromise <T>(createPromise: () => Promise<T>, ignoredStatusCodes: number[]) {
  const backoff = new FibonacciBackoff({
    min: 2000,
    step: 2000,
    jitter: 0.5,
  })

  let retryCount = 0
  while (true) {
    try {
      return await createPromise()
    } catch (err) {
      if (err.response && !ignoredStatusCodes.includes(err.response.status)) {
        throw err
      }

      if (retryCount > 2) {
        throw err
      }
    }

    retryCount++
    await sleep(backoff.next())
  }
}

export const sleep = (milliseconds: number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export const sum = (numberArray: number[]): number => numberArray.reduce((a, b) => a + b, 0)
export const average = (numberArray: number[]): number => numberArray.length !== 0 ? sum(numberArray) / numberArray.length : 0
export const range = (start: number, stop: number, step: number) => Array.from({length: (stop - start) / step + 1}, (_, i) => start + (i * step))
export const roundUpAtMostTwoDecimalPlaces = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
