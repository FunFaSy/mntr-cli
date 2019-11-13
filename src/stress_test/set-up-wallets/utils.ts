import {prepareSignedTx, SendTxParams} from 'minter-js-sdk'
import {privateToAddressString} from 'minterjs-util'

import {StressTestContext} from '../types'

import {ONE_PIP} from './constants'

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

export function getQuantityOfCoinsFromErrorMessage(coin: string, txResultMessage?: string): number | null {
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
  return !isNaN(possiblyNumber) ? possiblyNumber / ONE_PIP : null
}
