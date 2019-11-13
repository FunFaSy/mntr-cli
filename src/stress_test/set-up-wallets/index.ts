import {CLIError} from '@oclif/errors'
import {cli} from 'cli-ux'
import * as dotProp from 'dot-prop'
import {Observable, throwError} from 'rxjs'
import {bufferCount, catchError, tap, toArray} from 'rxjs/operators'

import {StressTestContext, Wallet} from '../types'

import {WalletsGenerator} from './create-wallets-with-balance'
import {proccessTransactionGroups} from './proccess-transaction-groups'
import {getTopLevelTransactionGroup} from './top-level-transaction-group'
import {getCommisionSize, getQuantityOfCoinsFromErrorMessage} from './utils'
import {withWorkerPool} from './with-worker-pool'

export async function setUpWallets$(
  walletsQuantity: number,
  generateWallets: WalletsGenerator,
  context: StressTestContext
): Promise<Observable<Wallet>> {
  const commisionSize = await getCommisionSize(context)
  const minGasPrice = await context.minterClient.getMinGasPrice()
  const {depthIndex, groupSize, totalMoneyNeeded} = await getTopLevelTransactionGroup(walletsQuantity, commisionSize, minGasPrice, context)

  let proccesedWalletsQunatity = 0
  return proccessTransactionGroups(depthIndex, groupSize, totalMoneyNeeded, commisionSize, minGasPrice, generateWallets, context).pipe(
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
    throw new CLIError(`Error occured while creatings wallets. ${ responseStatus ? `Status code #${ responseStatus }` : '' }`)
  }
}
