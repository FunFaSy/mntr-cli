import {generateWallet} from 'minter-js-sdk'
import {parentPort} from 'worker_threads'

if (parentPort !== null) {
  parentPort.on('message', param => {
    parentPort && parentPort.postMessage([...Array(param)].map(() => {
      const wallet = generateWallet()
      return {
        address: wallet.getAddressString(),
        privateKey: wallet.getPrivateKeyString(),
      }
    }))
  })
}

export const getWorkerPath = () => __dirname + '/worker.js'
