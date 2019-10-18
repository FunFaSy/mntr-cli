import {mergeStringToNumberMaps} from '../utils'

export interface TransactionBatchStats {
  totalRequestsCount: number,
  succesfulNodeResponsesCount: number
  failedNodeResponsesCount: number
  failedNodeResponsesStats: Map<string, number> // status_code to quantity
  succesfulTransactionsCount: number
  failedTransactionsCount: number
}

export const getInitialTransactionBatchStats = (): TransactionBatchStats => ({
  totalRequestsCount: 0,
  succesfulNodeResponsesCount: 0,
  failedNodeResponsesCount: 0,
  failedNodeResponsesStats: new Map(),
  succesfulTransactionsCount: 0,
  failedTransactionsCount: 0,
})

export const mergeTransactionBatchStats = (
  stressTestResult: TransactionBatchStats,
  transactionsBanchResult: TransactionBatchStats
): TransactionBatchStats => {
  return {
    totalRequestsCount: (
      stressTestResult.totalRequestsCount + transactionsBanchResult.totalRequestsCount
    ),
    succesfulNodeResponsesCount: (
      stressTestResult.succesfulNodeResponsesCount + transactionsBanchResult.succesfulNodeResponsesCount
    ),
    failedNodeResponsesCount: (
      stressTestResult.failedNodeResponsesCount + transactionsBanchResult.failedNodeResponsesCount
    ),
    failedNodeResponsesStats: mergeStringToNumberMaps(
      stressTestResult.failedNodeResponsesStats, transactionsBanchResult.failedNodeResponsesStats
    ),
    succesfulTransactionsCount: (
      stressTestResult.succesfulTransactionsCount + transactionsBanchResult.succesfulTransactionsCount
    ),
    failedTransactionsCount: (
      stressTestResult.failedTransactionsCount + transactionsBanchResult.failedTransactionsCount
    ),
  }
}
