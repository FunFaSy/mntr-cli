import {SendTxParams} from 'minter-js-sdk'
import {forkJoin, from, Observable, of} from 'rxjs'
import {catchError, map, tap} from 'rxjs/operators'

import {RequestStatus, Status} from '../request-status'
import {Wallet, StressTestContext} from '../types'
import {backoffedPromise} from '../utils'

function createAndSendTransaction(context: StressTestContext) {
  const createTransaction = async () => (
    backoffedPromise(() =>
      context.minterClient.postTx(
        new SendTxParams({
          privateKey: context.privateKey,
          address: context.address,
          amount: context.transeferedCoinAmount,
          coinSymbol: context.coin,
          feeCoinSymbol: context.coin,
        }), {gasRetryLimit: 4}
      )
    )
  )

  return from(createTransaction()).pipe(
    map(() => {
      const requestStatus: RequestStatus = {
        nodeResponse: {
          status: Status.OK,
        },
        transactionStatus: Status.OK
      }

      return requestStatus
    }),
    catchError(err => {
      const requestStatus: RequestStatus = err.response !== undefined ? {
        nodeResponse: {
          status: Status.FAILED,
          statusCode: err.response.status.toString(),
        },
        transactionStatus: err.response.status === 412 ? Status.FAILED : Status.OK
      } : {
        nodeResponse: {
          status: Status.FAILED,
          statusCode: err.code,
        },
        transactionStatus: Status.FAILED
      }
      if (err.response) {
        context.logger.error({
          message: JSON.stringify(err.response.data)
        })
      } else if (err.message) {
        context.logger.error({
          message: `${ err.message }: ${ err.code }`
        })
      }
      return of(requestStatus)
    })
  )
}

export function createTransactionBatch(wallets: Wallet[], context: StressTestContext): Observable<RequestStatus[]> {
  return forkJoin(
    wallets.map(wallet => createAndSendTransaction({
      ...context,
      privateKey: wallet.privateKey,
    }))
  ).pipe(
    tap(results => context.logger.debug(`Received results: ${ JSON.stringify(results) }`))
  )
}
