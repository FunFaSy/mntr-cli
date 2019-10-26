mntr-cli
====

> A stress test CLI for Minter Blockhain

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/mntr-cli.svg)](https://npmjs.org/package/mntr-cli)
[![Downloads/week](https://img.shields.io/npm/dw/mntr-cli.svg)](https://npmjs.org/package/mntr-cli)
[![License](https://img.shields.io/npm/l/mntr-cli.svg)](https://github.com/tasyp/mntr-cli/blob/master/package.json)

A simple but very powerful tool to test any node for reliability.

Features:

- Response stats
- Shows failed responses by status code
- In-depth logging, if `MNTR_DEBUG=*` env variable is set

## Usage

We recommend to run this at first:
```
$ ulimit -n 2048
```

To use production version:
```
$ yarn global add mntr-cli
$ npx mntr-cli -p PRIVATE_KEY -n https://gungnir.stakeholder.space --rate 100 --duration 10 -s Mxbc04b1c077df678355c6c7c924d0f59ce66acf4f
```
To use dev version:
```
$ git clone https://github.com/tasyp/mntr-cli
$ cd mntr-cli/
$ ./bin/run -p PRIVATE_KEY -n https://gungnir.stakeholder.space --rate 100 --duration 10 -s Mxbc04b1c077df678355c6c7c924d0f59ce66acf4f
```

## Command Params

Available CLI arguments

* `--privateKey / -p` _[string]_  - Wallet private key which will be used to send transactions.
* `--node / -n` _[string]_ - A node URI to connect to.
* `--send_to / -s` _[string]_ - The address of test transactions retriever
* `--rate / -r` _[integer=2000]_ - The amount of requests per second.
* `--duration / -d` _[integer=60]_ - The duration of test in seconds
* `--coin / -c` _[string='MNT']_ - A coin to use for transactions
* `--amount / -a` _[float='0.01']_ - The amount of coins used for a test transactions
* `--maxSockets / -m` _[integer=2048]_ - Max sockets amount
* `--chainId / -i` _[string='2']_ - Chain ID to use: 1 for mainnet and 2 for testnet