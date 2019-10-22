import {TransactionBatchStats} from './transaction-batch'

export enum Status {
  OK,
  FAILED
}

export interface RequestStatus {
  nodeResponse: {
    status: Status.OK
  } | {
    status: Status.FAILED,
    statusCode: string
    statusMessage: string
  },
  transactionStatus: Status
}

export function convertRequestStatusesToTransactionBanchStats(requestStatuses: RequestStatus[]): TransactionBatchStats {
  const failedNodeResponses = requestStatuses.filter(requestStatus => requestStatus.nodeResponse.status === Status.FAILED)

  return {
    totalRequestsCount: requestStatuses.length,
    succesfulNodeResponsesCount: requestStatuses.filter(requestStatus => requestStatus.nodeResponse.status === Status.OK).length,
    failedNodeResponsesCount: failedNodeResponses.length,
    failedNodeResponsesStats: failedNodeResponses.reduce(
      (failedNodeResponsesStats, requestStatus) => {
        if (requestStatus.nodeResponse.status === Status.FAILED && failedNodeResponsesStats.has(requestStatus.nodeResponse.statusCode)) {
          const statusCode = requestStatus.nodeResponse.statusCode
          const statusCodeSeenCount = failedNodeResponsesStats.get(statusCode)
          failedNodeResponsesStats.set(statusCode, statusCodeSeenCount! + 1)
        } else if (requestStatus.nodeResponse.status === Status.FAILED) {
          const statusCode = requestStatus.nodeResponse.statusCode
          failedNodeResponsesStats.set(statusCode, 1)
        }
        return failedNodeResponsesStats
      }, new Map<string, number>()
    ),
    failedNodeResponsesMessages: failedNodeResponses.reduce(
      (failedNodeResponsesMessages, requestStatus) => {
        if (requestStatus.nodeResponse.status === Status.FAILED) {
          const statusCode = requestStatus.nodeResponse.statusCode
          failedNodeResponsesMessages.set(statusCode, requestStatus.nodeResponse.statusMessage)
        }
        return failedNodeResponsesMessages
      }, new Map<string, string>()
    ),
    succesfulTransactionsCount: requestStatuses.filter(requestStatus => requestStatus.transactionStatus === Status.OK).length,
    failedTransactionsCount: requestStatuses.filter(requestStatus => requestStatus.transactionStatus === Status.FAILED).length,
  }
}
