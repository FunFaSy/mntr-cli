const { generateWallet } = require('minter-js-sdk');
const { parentPort } = require('worker_threads');
 
parentPort.on("message", (param) => {
  parentPort.postMessage([...Array(param)].map(() => {
    const wallet = generateWallet()
    return {
      address: wallet.getAddressString(),
      privateKey: wallet.getPrivateKeyString(),
    }
  }));
});