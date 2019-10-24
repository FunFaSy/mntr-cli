import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'

import {createStressTest} from './stress_test'
import {supressConsoleLog} from './utils'

require('events').EventEmitter.defaultMaxListeners = 50

class Mntr extends Command {
  static description = 'A stress test CLI tool for Minter blockhain'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    privateKey: flags.string({char: 'p', required: true, description: 'Wallet private key'}),
    node: flags.string({char: 'n', required: true, description: 'A node URI to connect to'}),
    coin: flags.string({char: 'c', default: 'MNT', description: 'A coin to use for transactions'}),
    send_to: flags.string({char: 's', required: true, description: 'The address of test transactions retriever'}),
    rate: flags.integer({char: 'r', default: 2000, description: 'The amount of requests per second'}),
    duration: flags.integer({char: 'd', default: 60, description: 'The duration of test in seconds'}),
    amount: flags.string({char: 'a', default: '0.0001', description: 'The amount of coins used for test transactions'}),
    maxSockets: flags.integer({char: 'm', default: 2048, description: 'Max sockets amount'}),
    chainId: flags.string({char: 'i', default: '2', description: 'Chain ID to use: 1 for mainnet and 2 for testnet'}),
  }

  async run() {
    supressConsoleLog() // minter-js-sdk prints out logs it wasn't asked for

    const {flags} = this.parse(Mntr)

    const amount = parseFloat(flags.amount)

    const stressTest$ = await createStressTest({
      rate: flags.rate,
      privateKey: flags.privateKey,
      transeferedCoinAmount: amount,
      coin: flags.coin,
      maxSockets: flags.maxSockets,
      chainId: flags.chainId,
      address: flags.send_to,
      nodeBaseUrl: flags.node,
      durationInSeconds: flags.duration,
    })
    const stressTestResult = await stressTest$.toPromise()

    cli.action.stop('Done!')

    this.log(`Total Requests: ${ stressTestResult.totalRequestsCount }`)
    this.log(`Succesful Transactions: ${ stressTestResult.succesfulTransactionsCount }`)
    this.log(`Failed Transactions: ${ stressTestResult.failedTransactionsCount }`)
    this.log(`Succesful Node Responses: ${ stressTestResult.succesfulNodeResponsesCount }`)
    this.log(`Failed Node Responses: ${ stressTestResult.failedNodeResponsesCount }`)

    const failedNodeResponses = [
      ...stressTestResult.failedNodeResponsesStats.entries()
    ].map(([key, value]) => ({
      statusCode: key,
      count: value,
      message: stressTestResult.failedNodeResponsesMessages.get(key) || ''
    }))

    if (failedNodeResponses.length > 0) {
      cli.table(failedNodeResponses, {
        statusCode: {
          header: 'Status Code'
        },
        count: {
          header: 'Count'
        },
        message: {
          header: 'Error payload'
        }
      })
    }

    this.exit(0)
  }
}

export = Mntr
