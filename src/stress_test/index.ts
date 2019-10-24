import cli from 'cli-ux'
import {from, interval, Observable, zip} from 'rxjs'
import {map, mergeMap, reduce, share, take, tap} from 'rxjs/operators'

import {createStressTestContext} from './context'
import {convertRequestStatusesToTransactionBanchStats, RequestStatus} from './request-status'
import {setUpWallets} from './set-up-wallets'
import {createTransactionBatch, getInitialTransactionBatchStats, mergeTransactionBatchStats, TransactionBatchStats} from './transaction-batch'
import {StressTestParams} from './types'

export async function createStressTest(
  params: StressTestParams
): Promise<Observable<TransactionBatchStats>> {
  const context = createStressTestContext(params)

  cli.action.start('Creatings wallets')

  const walletsQuantity = context.rate * context.durationInSeconds
  const wallets = await setUpWallets(walletsQuantity, params.rate, context)

  cli.action.stop('Done!')
  cli.action.start('Sending requests')

  let passedSeconds = 0
  let receivedRequests = 0
  return zip(
    interval(1500),
    from(wallets)
  ).pipe(
    take(params.durationInSeconds),
    tap(([index, _]) => {
      passedSeconds = passedSeconds + 1
      cli.action.start(`Sending requests ${ index + 1 }s/${ context.durationInSeconds }s`)
      if (index + 1 === context.durationInSeconds) {
        cli.action.stop('Done!')
      }
    }),
    mergeMap(([_, wallets]) => (
      createTransactionBatch(wallets, context)
    )),
    tap(() => {
      receivedRequests = receivedRequests + 1
      if (passedSeconds === context.durationInSeconds) {
        cli.action.start(`Received responses ${ receivedRequests }/${ walletsQuantity}`)
      }
    }),
    map((requestStatuses: RequestStatus): TransactionBatchStats => (
      convertRequestStatusesToTransactionBanchStats([requestStatuses])
    )),
    reduce((stressTestResult: TransactionBatchStats, transactionsBanchResult: TransactionBatchStats): TransactionBatchStats => (
      mergeTransactionBatchStats(stressTestResult, transactionsBanchResult)
    ), getInitialTransactionBatchStats()),
    share()
  )
}
