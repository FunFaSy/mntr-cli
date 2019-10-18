import {StaticPool} from 'node-worker-threads-pool'

export async function withWorkerPool<T>(wrapperFunc: (pool: StaticPool) => Promise<T>): Promise<T> {
  const pool = new StaticPool({
    size: 10,
    task: __dirname + '/worker.js',
  })

  const result = await wrapperFunc(pool)

  pool.destroy()

  return result
}
