import {Logger} from 'winston'

export interface MinterClient {
  postTx(txParams: any, params?: object): Promise<string>
  estimateTxCommission(tx: any): Promise<number>
}

export interface Wallet {
  getAddressString(): string
  getPrivateKeyString(): string
}

export interface CustomWallet {
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
  minterClient: MinterClient,
  logger: Logger
}
