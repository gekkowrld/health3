# health3

## Introduction

This project demonstrates a basic Hardhat use case, focusing on testing a Lock smart contract. It includes a sample contract, some tests for that contract, and a script that deploys the contract.

The project utilizes:
- Hardhat as the development environment
- Chai for assertions
- web3.js for interacting with Ethereum

## Resources

<https://docs.web3js.org/guides/smart_contracts/smart_contracts_guide>

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) (latest version)
- [Bun](https://bun.sh/docs/installation) (latest version)
- Basic understanding of JavaScript and Ethereum smart contracts

## Getting Started

Follow these steps to set up and run the project locally.

### Installation

 Install packages:
   
   `bun install`

### Compiling the Contract

Compile the smart contract with:

`bun run compile`

This compiles contracts in the `contracts/` directory and generates artifacts.

### Running Tests

Execute tests with:

`bun run test`

This runs all test files in the `test/` directory.

### Start the server

First start a local etherium server using hardhat (open at `<http://localhost:8545>`)

`bun run node`

Start the frontend using (on a different terminal tab, don't kill the previous process):

`bun run index.ts`

This will compile and deploy the smart contracts then start a local server at `<http://localhost:3000>`

## Project Structure

- `contracts/`: Solidity smart contracts
- `src/`: The code for displaying the frontend
- `index.ts`: The entry point of the code
- `test/`: Test files for smart contracts
- `hardhat.config.js`: Hardhat configuration
