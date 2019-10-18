mntr-cli
====

> A stress test CLI for Minter Blockhain

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/mntr-cli.svg)](https://npmjs.org/package/mntr-cli)
[![Downloads/week](https://img.shields.io/npm/dw/mntr-cli.svg)](https://npmjs.org/package/mntr-cli)
[![License](https://img.shields.io/npm/l/mntr-cli.svg)](https://github.com/tasyp/mntr-cli/blob/master/package.json)

A simple but very powerful tool to use to test any node for reliability.

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
$ npx mntr-cli -p PRIVATE_KEY -n https://gungnir.stakeholder.space --rate 100 --duration 10 -s Mxbc04b1c077df678355c6c7c924d0f59ce66acf4f
```
To use dev version:
```
$ git clone https://github.com/tasyp/mntr-cli
$ cd mntr-cli/
$ ./bin/run -p PRIVATE_KEY -n https://gungnir.stakeholder.space --rate 100 --duration 10 -s Mxbc04b1c077df678355c6c7c924d0f59ce66acf4f
```

## Commands

<!-- commands -->
