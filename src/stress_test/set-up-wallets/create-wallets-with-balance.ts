import {MultisendTxParams} from 'minter-js-sdk'
import pThrottle from 'p-throttle'
import {from, zip} from 'rxjs'
import {delay, mergeMap} from 'rxjs/operators'

import {StressTestContext, Wallet} from '../types'
import {backoffedPromise} from '../utils'

import {ONE_BLOCK_PROCESSING_TIME_IN_MILLISECONDS} from './constants'

const rateLimiter = pThrottle(async (func: () => Promise<any>) => {
  return func()
}, 100, 5000)

export type WalletsGenerator = (walletsQuantity: number) => Promise<Wallet[]>

export async function createWalletsWithBalance(
  initialBalances: number[],
  walletsQuantity: number, // 100 is max
  generateWallets: WalletsGenerator,
  context: StressTestContext
): Promise<[Wallet[], number[]]> {
  if (walletsQuantity > 100) {
    throw Error('You cannot create more than 100 wallets with initial balance at once.')
  }
  if (initialBalances.length !== walletsQuantity) {
    throw Error('Length of the balance array should match to the equantity of requestes wallets.')
  }

  const wallets: Wallet[] = await generateWallets(walletsQuantity)

  await rateLimiter(() => (
    backoffedPromise(() => (
      context.minterClient.postTx(
        new MultisendTxParams({
          privateKey: context.privateKey,
          list: wallets.map((wallet, walletIndex) => ({
            value: initialBalances[walletIndex],
            coin: context.coin,
            to: wallet.address,
          })),
          feeCoinSymbol: context.coin,
        }), {gasRetryLimit: 4}
      )
    ), [429, 502])
  ))

  return [wallets, initialBalances]
}

export const createWalletsWithBalance$ = (
  initialBalances: number[],
  walletsQuantity: number, // 100 is max
  generateWallets: WalletsGenerator,
  context: StressTestContext
) => (
  from(createWalletsWithBalance(
    initialBalances,
    walletsQuantity,
    generateWallets,
    context,
  )).pipe(
    delay(ONE_BLOCK_PROCESSING_TIME_IN_MILLISECONDS),
    mergeMap(([wallets, initialBalances]) => (
      zip(from(wallets), from(initialBalances))
    ))
  )
)
