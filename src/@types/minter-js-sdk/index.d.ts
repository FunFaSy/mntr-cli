/// <reference types="axios" />

declare module 'minter-js-sdk' {
  import { AxiosRequestConfig } from 'axios';

  interface MinterClientOptions extends AxiosRequestConfig {
    apiType?: 'gate' | 'node';
    chainId: string;
    baseURL: string;
  }

  class Minter {
    constructor(options: MinterClientOptions)
    postTx(txParams: TxParams, params?: { gasRetryLimit?: number }): Promise<string>
    estimateTxCommission(tx: any): Promise<number>
  }

  type MinterTx = {}
  type TxParams = MultisendTxParams | SendTxParams

  interface TxParamsOptions {
    privateKey: string | Buffer;
    chainId?: string;
    nonce?: number;
    gasPrice?: number;
    message?: string;
    txType?: string | Buffer
    txData?: Buffer
  }

  namespace MultisendTxParams  {
    interface Options extends TxParamsOptions {
      list: Transaction[];
      feeCoinSymbol: string;
    }

    type Transaction =  {
      value: number;
      coin: string;
      to: string;
    }
  }

  class MultisendTxParams {
    constructor(params: MultisendTxParams.Options)
  }

  namespace SendTxParams  {
    interface Options extends TxParamsOptions {
      address: string;
      amount: number | string;
      coinSymbol: string;
      feeCoinSymbol: string;
    }
  }

  class SendTxParams {
    constructor(params: SendTxParams.Options)
  }

  function prepareSignedTx(txParams: TxParams): any
}