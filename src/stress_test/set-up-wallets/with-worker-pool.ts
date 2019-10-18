import {StaticPool} from 'node-worker-threads-pool'

import { getWorkerPath } from './worker'

export async function withWorkerPool<T>(wrapperFunc: (pool: StaticPool) => Promise<T>): Promise<T> {
  const pool = new StaticPool({
    size: 10,
    task: getWorkerPath(),
  })

  const result = await wrapperFunc(pool)

  pool.destroy()

  return result
}
