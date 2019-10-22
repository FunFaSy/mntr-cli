import {StaticPool} from 'node-worker-threads-pool'

import {getWorkerPath} from './worker'

async function withOnCompleteCallback<T>(func: () => Promise<T>, onComplete: () => void) {
  try {
    const result = await func()
    onComplete()
    return result
  } catch (err) {
    onComplete()
    throw err
  }
}

export async function withWorkerPool<T>(wrapperFunc: (pool: StaticPool) => Promise<T>): Promise<T> {
  const pool = new StaticPool({
    size: 10,
    task: getWorkerPath(),
  })

  const result = await withOnCompleteCallback<T>(
    () => wrapperFunc(pool),
    () => pool.destroy()
  )

  return result
}
