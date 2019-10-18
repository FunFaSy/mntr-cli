import * as https from 'https'
import {Minter} from 'minter-js-sdk'
import * as winston from 'winston'

import {MinterClient, StressTestContext, StressTestParams} from './types'

export const createStressTestContext = (params: StressTestParams): StressTestContext => {
  const minterClient: MinterClient = new Minter({
    apiType: 'node',
    baseURL: params.nodeBaseUrl,
    httpsAgent: new https.Agent({
      keepAlive: true,
      maxSockets: params.maxSockets,
      timeout: 60 * 1000,
      rejectUnauthorized: false
    })
  })

  const logger = winston.createLogger({
    level: process.env.MNTR_DEBUG ? 'silly' : 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({filename: 'error.log', level: 'error'}),
      new winston.transports.File({filename: 'combined.log'})
    ],
  })

  return {...params, minterClient, logger}
}
