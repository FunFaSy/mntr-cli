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

  return zip(
    interval(1000),
    from(wallets)
  ).pipe(
    take(params.durationInSeconds),
    tap(([index, _]) => cli.action.start(`Sending requests ${ index + 1 }s/${ context.durationInSeconds }s`)),
    mergeMap(([_, wallets]) => (
      createTransactionBatch(wallets, context)
    )),
    map((requestStatuses: RequestStatus[]): TransactionBatchStats => (
      convertRequestStatusesToTransactionBanchStats(requestStatuses)
    )),
    reduce((stressTestResult: TransactionBatchStats, transactionsBanchResult: TransactionBatchStats): TransactionBatchStats => (
      mergeTransactionBatchStats(stressTestResult, transactionsBanchResult)
    ), getInitialTransactionBatchStats()),
    share()
  )
}
