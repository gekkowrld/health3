import solc = require("solc");
import path = require("path");
import fs = require("fs");
import { Web3 } from "web3";
import { serve } from "bun";
import { Page } from "./src/server";

// Compile contract and save ABI and Bytecode
async function compileContract(contractName: string) {
	const fileName = `${contractName}.sol`;
	const sourceCode = fs.readFileSync(
		path.join(__dirname, "contracts", fileName),
		"utf8",
	);

	// solc compiler config
	const input = {
		language: "Solidity",
		sources: {
			[fileName]: {
				content: sourceCode,
			},
		},
		settings: {
			outputSelection: {
				"*": {
					"*": ["*"],
				},
			},
		},
	};

	const compiledCode = JSON.parse(solc.compile(JSON.stringify(input)));

	// Get the bytecode from the compiled contract
	const bytecode =
		compiledCode.contracts[fileName][contractName].evm.bytecode.object;

	// Write the bytecode to a new file
	const bytecodePath = path.join(__dirname, "bytecode", `${contractName}.bin`);
	fs.writeFileSync(bytecodePath, bytecode);

	// Get the ABI from the compiled contract
	const abi = compiledCode.contracts[fileName][contractName].abi;

	// Write the Contract ABI to a new file
	const abiPath = path.join(__dirname, "bytecode", `${contractName}.json`);
	fs.writeFileSync(abiPath, JSON.stringify(abi, null, "\t"));

	return [abiPath, bytecodePath];
}

// Deploy the contract and return the address of the deployed contract
async function deploy(
	web3: any,
	abiPath: string,
	bytecodePath: string,
	contractName: string,
): Promise<[string]> {
	const bytecode = fs.readFileSync(bytecodePath, "utf8");
	const abi = require(abiPath);
	const myContract = new web3.eth.Contract(abi);

	// Retrieve accounts from the provider (e.g., local Ganache or other node)
	const providersAccounts = await web3.eth.getAccounts();
	const defaultAccount = providersAccounts[0];
	console.log("Deployer account:", defaultAccount);

	const contractDeployer = myContract.deploy({
		data: "0x" + bytecode,
	});

	// Estimate gas for the deployment
	const gas = await contractDeployer.estimateGas({
		from: defaultAccount,
	});
	console.log("Estimated gas:", gas);

	try {
		const tx = await contractDeployer.send({
			from: defaultAccount,
			gas,
			gasPrice: 10000000000, // You may adjust gas price based on network conditions
		});
		console.log("Contract deployed at address: " + tx.options.address);

		const deployedAddressPath = path.join(
			__dirname,
			"bytecode",
			`${contractName}.txt`,
		);
		fs.writeFileSync(deployedAddressPath, tx.options.address);

		return [deployedAddressPath];
	} catch (error) {
		console.error("Deployment error:", error);
	}

	return [""];
}

// Set up the server and routing using bunjs
async function server(
	web3: any,
	regPath: string,
	msgPath: string,
	regAbiPath: string,
	msgAbiPath: string,
): Promise<void> {
	const __server = serve({
		port: 3000,
		async fetch(req) {
			return await Page(web3, regAbiPath, msgAbiPath, regPath, msgPath, req);
		},
	});

	console.log(`Listening on localhost:${__server.port}`);
}

// Main function to deploy and interact with the contract
async function main() {
	const Register = "Register";
	console.log("Compiling: ", Register);

	const regPath = await compileContract(Register);
	const regAbiPath = regPath[0];
	const regBytecodePath = regPath[1];

	const Messaging = "Messaging";
	console.log("Compiling: ", Messaging);

	const msgPath = await compileContract(Messaging);
	const msgAbiPath = msgPath[0];
	const msgBytecodePath = msgPath[1];

	const web3 = new Web3("http://127.0.0.1:8545/");
	console.log("Started a new web3 instance\n");

	console.log("Deploying: ", Register);
	const values = await deploy(web3, regAbiPath, regBytecodePath, Register);
	const regAddress: string = values[0];

	console.log("Deploying: ", Messaging);
	const mVal = await deploy(web3, msgAbiPath, msgBytecodePath, Messaging);
	const msgAddress: string = mVal[0];

	console.log("Finished Deploying, starting the server.\n");
	await server(web3, regAddress, msgAddress, regAbiPath, msgAbiPath);
}

main();
