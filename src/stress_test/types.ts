import {Minter} from 'minter-js-sdk'
import {Logger} from 'winston'

export interface Wallet {
  address: string
  privateKey: string
}

interface Header {
  key: string
  value: string
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
  nodeBaseUrl: string,
  headers: Header[],
}

export type StressTestContext = StressTestParams & {
  minterClient: Minter,
  logger: Logger
}
