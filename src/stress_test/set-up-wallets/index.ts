import {CLIError} from '@oclif/errors'
import {cli} from 'cli-ux'
import * as dotProp from 'dot-prop'
import {prepareSignedTx, SendTxParams} from 'minter-js-sdk'
import {privateToAddressString} from 'minterjs-util'
import {Observable, throwError} from 'rxjs'
import {bufferCount, catchError, tap, toArray} from 'rxjs/operators'

import {CustomWallet, StressTestContext} from '../types'
import {range, sum} from '../utils'

import {MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, ONE_PIP} from './constants'
import {WalletsGenerator} from './create-wallets-with-balance'
import {proccessTransactionGroups} from './proccess-transaction-groups'
import {withWorkerPool} from './with-worker-pool'

export function getTopLevelTransactionGroupParams(totalTransactionsQuantity: number): { depthIndex: number, groupSize: number } {
  let groupSize = totalTransactionsQuantity
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
        chainId: 2,
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

export async function setUpWallets$(
  walletsQuantity: number,
  generateWallets: WalletsGenerator,
  context: StressTestContext
): Promise<Observable<CustomWallet>> {
  const {depthIndex: maxDepthIndex, groupSize} = getTopLevelTransactionGroupParams(walletsQuantity)
  const commisionSize = await getCommisionSize(context)

  const zeroDepthTransactionsCount = groupSize * Math.pow(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, maxDepthIndex)
  const zeroDepthMoneyNeeded = (
    zeroDepthTransactionsCount * (context.transeferedCoinAmount + commisionSize * 10)
  )

  const totalMoneyNeeded = sum([
    zeroDepthMoneyNeeded,
    ...range(0, maxDepthIndex, 1).map(depthIndex => {
      const transactionsCount = Math.ceil(groupSize) * Math.pow(MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND, depthIndex)
      const multiSendCommisionSize = transactionsCount * (
        commisionSize + (MAX_QUANTITY_OF_TRANSCATIONS_IN_MULTI_SEND - 1) * commisionSize / 2
      )
      return multiSendCommisionSize
    }),
  ])

  context.logger.debug({
    message: `Needed Wallets Quantity: ${ walletsQuantity }`
  })
  context.logger.debug({
    message: `Top level group size: ${ groupSize }, Max Depth Index: ${ maxDepthIndex }, Zero Depth Money Needed: ${ zeroDepthMoneyNeeded }, Total money needed: ${ totalMoneyNeeded }`
  })

  let proccesedWalletsQunatity = 0
  return proccessTransactionGroups(maxDepthIndex, groupSize, totalMoneyNeeded, commisionSize, generateWallets, context).pipe(
    tap(() => {
      if (proccesedWalletsQunatity < walletsQuantity) {
        proccesedWalletsQunatity = proccesedWalletsQunatity + 1
      }
      cli.action.start(`Creatings wallets ${ proccesedWalletsQunatity }/${ walletsQuantity }`)
    }),
    catchError((err: any) => {
      if (err.response) {
        context.logger.error({
          message: JSON.stringify(err.response.data)
        })
      } else if (err.message) {
        context.logger.error({
          message: `${ err.message }: ${ err.code }`
        })
      }
      return throwError(err)
    }),
  )
}

const getQuantityOfCoinsFromErrorMessage = (coin: string, txResultMessage?: string): number | null => {
  if (txResultMessage === undefined) {
    return null
  }
  const re = new RegExp(`Wanted\\s+(\\d+)\\s+${ coin.toUpperCase() }`)
  const quantityOfCoinsMatches = txResultMessage.match(re)
  if (quantityOfCoinsMatches === null) {
    return null
  }
  const coinsQuantity: string | undefined = quantityOfCoinsMatches[1]
  if (coinsQuantity === undefined) {
    return null
  }
  const possiblyNumber = parseInt(coinsQuantity.trim(), 10)
  return possiblyNumber !== NaN ? possiblyNumber / ONE_PIP : null
}

export async function setUpWallets(walletsQuantity: number, rate: number, context: StressTestContext) {
  try {
    return await withWorkerPool(async pool => {
      const wallets$ = await setUpWallets$(walletsQuantity, walletsQuantity => (
        pool.exec(walletsQuantity)
      ), context)
      return wallets$.pipe(
        bufferCount(rate),
        toArray()
      ).toPromise()
    })
  } catch (err) {
    const txResultCode = dotProp.get<number | undefined>(err, 'response.data.error.tx_result.code')
    if (txResultCode === 107) {
      const txResultMessage = dotProp.get<string | undefined>(err, 'response.data.error.tx_result.message')
      const quantityOfCoins = getQuantityOfCoinsFromErrorMessage(context.coin, txResultMessage)
      throw new CLIError(`Not enough funds to create wallets. ${
        txResultMessage ? `Needed amount of money: ${ quantityOfCoins ? quantityOfCoins : '' }` : ''
      }`)
    }
    const responseStatus = dotProp.get<number | undefined>(err, 'response.status')
    throw new CLIError(`Error occured while creatings wallets. Check logs. ${ responseStatus ? `Status code #${ responseStatus }` : '' }`)
  }
}
