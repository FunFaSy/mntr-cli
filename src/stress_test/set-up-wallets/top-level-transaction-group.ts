import {prepareSignedTx, SendTxParams} from 'minter-js-sdk'
import {privateToAddressString} from 'minterjs-util'

import {StressTestContext} from '../types'
import {range, sum} from '../utils'

import {MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, ONE_PIP} from './constants'

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

export async function getCommisionSize(context: StressTestContext): Promise<number> {
  const commisionSize = await context.minterClient.estimateTxCommission({
    transaction: prepareSignedTx(
      new SendTxParams({
        privateKey: context.privateKey,
        nonce: 1,
        address: privateToAddressString(Buffer.from(context.privateKey, 'hex')),
        amount: 1,
        coinSymbol: context.coin,
        feeCoinSymbol: context.coin,
      })
    ).serialize().toString('hex')
  })
  return commisionSize / ONE_PIP
}

export function getZeroDepthMoneyNeeded(groupSize: number, depthIndex: number, commisionSize: number, context: StressTestContext): number {
  const zeroDepthTransactionsCount = groupSize * Math.pow(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, depthIndex)
  return (
    zeroDepthTransactionsCount * (context.transeferedCoinAmount + commisionSize * 52)
  )
}

export function getTotalMoneyNeeded(groupSize: number, depthIndex: number, commisionSize: number, transeferedCoinAmount: number) {
  const zeroDepthTransactionsCount = groupSize * Math.pow(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, depthIndex)
  const zeroDepthMoneyNeeded = zeroDepthTransactionsCount * (transeferedCoinAmount + commisionSize * 52)

  return Math.ceil(
    sum([
      zeroDepthMoneyNeeded,
      ...range(0, depthIndex, 1).map(currentDepthIndex => {
        const transactionsCount = depthIndex === 0 ? 1 : Math.ceil(groupSize) * Math.pow(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, currentDepthIndex - 1)
        const multiSendCommisionSize = transactionsCount * (
          commisionSize + (MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND - 1) * (commisionSize / 2)
        ) * 2
        return multiSendCommisionSize
      }),
    ])
  )
}

export async function getTopLevelTransactionGroup(walletsQuantity: number, context: StressTestContext) {
  const {depthIndex, groupSize} = getSmallestPossibleGroup(walletsQuantity)
  const commisionSize = await getCommisionSize(context)

  context.logger.debug({
    message: `Needed Wallets Quantity: ${ walletsQuantity }`
  })
  context.logger.debug({
    message: `Top level group size: ${ groupSize }, Max Depth Index: ${ depthIndex }`
  })

  const totalMoneyNeeded = getTotalMoneyNeeded(groupSize, depthIndex, commisionSize, context.transeferedCoinAmount)

  context.logger.debug({
    message: `Total money needed: ${ totalMoneyNeeded }`
  })

  return {depthIndex, groupSize, totalMoneyNeeded, commisionSize}
}
