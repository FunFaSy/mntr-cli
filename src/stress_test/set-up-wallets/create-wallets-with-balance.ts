import {MultisendTxParams} from 'minter-js-sdk'
import pThrottle from 'p-throttle'
import {from} from 'rxjs'
import {delay, mergeMap} from 'rxjs/operators'

import {StressTestContext, Wallet} from '../types'
import {backoffedPromise} from '../utils'

const rateLimiter = pThrottle(async (func: () => Promise<any>) => {
  return func()
}, 100, 5000)

export type WalletsGenerator = (walletsQuantity: number) => Promise<Wallet[]>

export async function createWalletsWithBalance(
  initialBalance: number,
  walletsQuantity: number, // 100 is max
  generateWallets: WalletsGenerator,
  context: StressTestContext
): Promise<Wallet[]> {
  if (walletsQuantity > 100) {
    throw Error('You cannot create more than 100 wallets with initial balance at once.')
  }

  const wallets: Wallet[] = await generateWallets(walletsQuantity)

  await rateLimiter(() => (
    backoffedPromise(() =>
      context.minterClient.postTx(
        new MultisendTxParams({
          privateKey: context.privateKey,
          list: wallets.map(wallet => ({
            value: initialBalance,
            coin: context.coin,
            to: wallet.address,
          })),
          feeCoinSymbol: context.coin,
        }), {gasRetryLimit: 4}
      )
    )
  ))

  return wallets
}

export const createWalletsWithBalance$ = (
  initialBalance: number,
  walletsQuantity: number, // 100 is max
  generateWallets: WalletsGenerator,
  context: StressTestContext
) => (
  from(createWalletsWithBalance(
    initialBalance,
    walletsQuantity,
    generateWallets,
    context,
  )).pipe(
    delay(5000),
    mergeMap(wallets => wallets)
  )
)
