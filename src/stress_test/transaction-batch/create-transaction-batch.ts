import {SendTxParams} from 'minter-js-sdk'
import {from, merge, Observable, of, throwError} from 'rxjs'
import {catchError, map, tap, timeoutWith} from 'rxjs/operators'

import {RequestStatus, Status} from '../request-status'
import {StressTestContext, Wallet} from '../types'
import {backoffedPromise} from '../utils'

const getTimeoutError = () => {
  const err = new Error('Request has timed out')
  // @ts-ignore
  err.code = 'TIMED_OUT'
  return err
}

function createAndSendTransaction(context: StressTestContext) {
  const createTransaction = async () => (
    backoffedPromise(() =>
      context.minterClient.postTx(
        new SendTxParams({
          privateKey: context.privateKey,
          address: context.address,
          amount: context.transeferedCoinAmount,
          gasPrice: 50,
          coinSymbol: context.coin,
          feeCoinSymbol: context.coin,
        }), {gasRetryLimit: 0}
      )
    )
  )

  return from(createTransaction()).pipe(
    timeoutWith(120 * 1000, throwError(getTimeoutError())),
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
          statusMessage: err.response.data.error.data,
        },
        transactionStatus: err.response.status === 412 ? Status.FAILED : Status.OK
      } : {
        nodeResponse: {
          status: Status.FAILED,
          statusCode: err.code,
          statusMessage: '',
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

export function createTransactionBatch(wallets: Wallet[], context: StressTestContext): Observable<RequestStatus> {
  return merge(
    ...wallets.map(wallet => createAndSendTransaction({
      ...context,
      privateKey: wallet.privateKey,
    }))
  ).pipe(
    tap(results => context.logger.debug(`Received results: ${ JSON.stringify(results) }`))
  )
}
