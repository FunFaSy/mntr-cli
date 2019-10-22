import {from, Observable, zip} from 'rxjs'
import {mergeMap} from 'rxjs/operators'

import {StressTestContext, Wallet} from '../types'
import {average} from '../utils'

import {MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND} from './constants'
import {createWalletsWithBalance$, WalletsGenerator} from './create-wallets-with-balance'

export function createGroupSizes$(groupSize: number, groupSizeReminder: number): Observable<number> {
  const groupSizes: number[] = Array(groupSize - groupSizeReminder).fill(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND)
  if (groupSizeReminder > 0) {
    groupSizes.push(groupSizeReminder * MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND)
  }

  const averageGroupSize = Math.ceil(average(groupSizes))
  return from(Array(Math.ceil(groupSize)).fill(averageGroupSize))
}

function getMoneyPerGroup(groupSize: number, moneyToSpend: number, commisionSize: number): number {
  const currentDepthTransactionsCount = Math.ceil(groupSize) * MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND

  const currentDepthCommisionSize = currentDepthTransactionsCount * (
    commisionSize + (MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND - 1) * commisionSize  / 2
  ) * 10

  return Math.ceil((moneyToSpend - currentDepthCommisionSize) / Math.ceil(groupSize))
}

export function proccessTransactionGroups(
  depthIndex: number,
  groupSize: number,
  moneyToSpend: number,
  commisionSize: number,
  generateWallet: WalletsGenerator,
  context: StressTestContext
): Observable<Wallet> {
  context.logger.debug({
    message: `Depth Index: ${ depthIndex }, Group Size: ${ groupSize }, MoneyToSpend: ${ moneyToSpend }, Commision Size: ${ commisionSize }`
  })

  if (depthIndex === 0) {
    return createWalletsWithBalance$((
      context.transeferedCoinAmount + commisionSize * 52
    ), groupSize, generateWallet, context)
  }

  const moneyPerGroup = getMoneyPerGroup(groupSize, moneyToSpend, commisionSize)
  const wallets$ = createWalletsWithBalance$(moneyPerGroup, Math.ceil(groupSize), generateWallet, context)
  const groupSizes$ = createGroupSizes$(groupSize, groupSize % 1)

  return zip(wallets$, groupSizes$).pipe(
    mergeMap(([wallet, groupSize]) => (
      proccessTransactionGroups(depthIndex - 1, groupSize, moneyPerGroup, commisionSize, generateWallet, {
        ...context,
        privateKey: wallet.privateKey,
      })
    ))
  )
}
