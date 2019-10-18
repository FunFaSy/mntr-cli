declare module 'node-worker-threads-pool' {
  type NotFunction<T> = T extends Function ? never : T;

  interface StaticPoolParams {
    size: number;
    task: string;
  }

  class StaticPool {
    constructor(params: StaticPoolParams)
    exec<T, U>(param: NotFunction<T>): Promise<NotFunction<U>>
    destroy(): void
  }
}