import {StressTestContext} from '../types'
import {range, sum} from '../utils'

import {MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND} from './constants'

export function getSmallestPossibleGroup(transactionsQuantity: number): { depthIndex: number, groupSize: number } {
  let groupSize = transactionsQuantity
  let depthIndex = 0
  while (groupSize > MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND) {
    groupSize = groupSize / MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND
    depthIndex++
  }
  return {
    depthIndex,
    groupSize
  }
}

export function getZeroDepthMoneyNeeded(groupSize: number, depthIndex: number, commisionSize: number, transeferedCoinAmount: number): number {
  const zeroDepthTransactionsCount = groupSize * Math.pow(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, depthIndex)
  return (
    zeroDepthTransactionsCount * (transeferedCoinAmount + commisionSize * 52)
  )
}

export function getTotalMoneyNeeded(groupSize: number, depthIndex: number, commisionSize: number, transeferedCoinAmount: number, minGasPrice: number) {
  const zeroDepthMoneyNeeded = getZeroDepthMoneyNeeded(groupSize, depthIndex, commisionSize, transeferedCoinAmount)

  return Math.ceil(
    sum([
      zeroDepthMoneyNeeded,
      ...range(0, depthIndex, 1).map(currentDepthIndex => {
        const transactionsCount = depthIndex === 0 ? 1 : Math.ceil(groupSize) * Math.pow(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, currentDepthIndex - 1)
        const multiSendCommisionSize = transactionsCount * (
          commisionSize + (MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND - 1) * (commisionSize / 2)
        ) * (minGasPrice + 2)
        return multiSendCommisionSize
      }),
    ])
  )
}

export async function getTopLevelTransactionGroup(
  walletsQuantity: number,
  commisionSize: number,
  minGasPrice: number,
  context: StressTestContext
) {
  const {depthIndex, groupSize} = getSmallestPossibleGroup(walletsQuantity)

  context.logger.debug({
    message: `Needed Wallets Quantity: ${ walletsQuantity }`
  })
  context.logger.debug({
    message: `Top level group size: ${ groupSize }, Max Depth Index: ${ depthIndex }`
  })

  const totalMoneyNeeded = getTotalMoneyNeeded(groupSize, depthIndex, commisionSize, context.transeferedCoinAmount, minGasPrice)

  context.logger.debug({
    message: `Total money needed: ${ totalMoneyNeeded }`
  })

  return {depthIndex, groupSize, totalMoneyNeeded}
}
