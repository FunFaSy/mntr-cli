import {from, Observable, zip} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'

import {StressTestContext, Wallet} from '../types'
import {roundUpAtMostTwoDecimalPlaces, sum} from '../utils'

import {MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND} from './constants'
import {createWalletsWithBalance$, WalletsGenerator} from './create-wallets-with-balance'

export function createGroupSizes(groupSize: number, groupSizeReminder: number): number[] {
  const groupSizes: number[] = Array(groupSize - groupSizeReminder).fill(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND)
  if (groupSizeReminder > 0) {
    groupSizes.push(groupSizeReminder * MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND)
  }

  return groupSizes
}

function getMoneyPerGroup(groupSizes: number[], moneyToSpend: number, commisionSize: number, minGasPrice: number): number[] {
  const currentDepthCommisionSize = sum(groupSizes.map(groupSize => (
    commisionSize + (groupSize - 1) * (commisionSize / 2)
  ) * minGasPrice))

  const moneyToSpendWithoutCommisionSize = moneyToSpend - currentDepthCommisionSize
  const groupSizesSum = sum(groupSizes)

  return groupSizes.map(groupSize => roundUpAtMostTwoDecimalPlaces(moneyToSpendWithoutCommisionSize * groupSize / groupSizesSum))
}

export function proccessTransactionGroups(
  depthIndex: number,
  groupSize: number,
  moneyToSpend: number,
  commisionSize: number,
  minGasPrice: number,
  generateWallet: WalletsGenerator,
  context: StressTestContext
): Observable<Wallet> {
  context.logger.debug({
    message: `Depth Index: ${ depthIndex }, Group Size: ${ groupSize }, MoneyToSpend: ${ moneyToSpend }, Commision Size: ${ commisionSize }`
  })

  if (depthIndex === 0) {
    return createWalletsWithBalance$(Array(groupSize).fill(
      context.transeferedCoinAmount + commisionSize * 52
    ), groupSize, generateWallet, context).pipe(
      map(([wallet, _]) => wallet)
    )
  }

  const groupSizes = createGroupSizes(groupSize, roundUpAtMostTwoDecimalPlaces(groupSize % 1))
  const moneyPerGroup = getMoneyPerGroup(groupSizes, moneyToSpend, commisionSize, minGasPrice)
  const wallets$ = createWalletsWithBalance$(moneyPerGroup, Math.ceil(groupSize), generateWallet, context)

  return zip(wallets$, from(groupSizes)).pipe(
    mergeMap(([[wallet, moneyToSpend], groupSize]) => (
      proccessTransactionGroups(depthIndex - 1, groupSize, moneyToSpend, commisionSize, minGasPrice, generateWallet, {
        ...context,
        privateKey: wallet.privateKey,
      })
    ))
  )
}
