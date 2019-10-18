import {Minter} from 'minter-js-sdk'
import {Logger} from 'winston'

export interface Wallet {
  address: string
  privateKey: string
}

export interface StressTestParams {
  rate: number
  privateKey: string
  durationInSeconds: number
  address: string
  maxSockets: number
  transeferedCoinAmount: number
  coin: string
  chainId: string
  nodeBaseUrl: string
}

export type StressTestContext = StressTestParams & {
  minterClient: Minter,
  logger: Logger
}
