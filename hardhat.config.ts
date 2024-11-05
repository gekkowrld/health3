import type { HardhatUserConfig } from "hardhat/config";
import { task } from "hardhat/config";
import "@nomicfoundation/hardhat-web3-v4";
import "@chainsafe/hardhat-ts-artifact-plugin"; //Plugin to generate artifacts in the typescript file to provide exact types of generated JSON objects.

const config: HardhatUserConfig = {
	solidity: "0.8.24",
};

// add this section for auto calling ts-artifact instead of npx hardhat ts-artifact after npx hardhat compile
// Override the compile task
task(
	"compile",
	"Compiles the contracts and performs additional operations",
	async (taskArguments, hre, runSuper) => {
		// Perform the original compile task
		await runSuper(taskArguments);

		// Now run the ts-artifact task
		await hre.run("ts-artifact");
	},
);

export default config;
