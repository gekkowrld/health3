import {
	time,
	loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { web3 } from "hardhat";
import {
	ContractExecutionError,
	PayableCallOptions,
	ContractConstructorArgs,
} from "web3";
import LockContract from "../artifacts/contracts/Lock.sol/Lock";
import { Artifact } from "hardhat/types";

describe("Lock", function () {
	/* We define a fixture to reuse the same setup in every test.
   We use loadFixture to run this setup once, snapshot that state,
   and reset Hardhat Network to that snapshot in every test. */
	const deployContract = async (
		contractName: string,
		constructorArgs: ContractConstructorArgs<typeof LockContract.abi>,
		txOptions: PayableCallOptions = {},
	) => {
		let txOptionsObj = txOptions;

		// use first default account if not provided explicitly for sending transaction
		if (web3.utils.isNullish(txOptionsObj.from))
			txOptionsObj = {
				from: (await web3.eth.getAccounts())[0],
				...txOptionsObj,
			};

		const artifact: Artifact = await hre.artifacts.readArtifact(contractName);

		// this will not have full types support
		const contract = new web3.eth.Contract(artifact.abi);

		const deployedContract = await contract
			.deploy({
				data: artifact.bytecode,
				arguments: constructorArgs,
			})
			.send(txOptionsObj);

		// this will be used for sending future transactions to contract for all .send() function calls
		deployedContract.defaultAccount = txOptionsObj.from;
		return deployedContract;
	};

	/*TODO: add  @chainsafe/hardhat-ts-artifact-plugin output support in Artifacts object in 
  HRE and use above function for reading abi from there with full types support */
	const deployLockContract = async (
		constructorArgs: ContractConstructorArgs<typeof LockContract.abi>,
		txOptions: PayableCallOptions = {},
	) => {
		let txOptionsObj = txOptions;
		const contractName = "Lock";

		// use first default account if not provided explicitly for sending transaction
		if (web3.utils.isNullish(txOptionsObj.from))
			txOptionsObj = {
				from: (await web3.eth.getAccounts())[0],
				...txOptionsObj,
			};

		const artifact: Artifact = await hre.artifacts.readArtifact(contractName);

		// For exact types support we will use @chainsafe/hardhat-ts-artifact-plugin by npx hardhat ts-artifact after npx hardhat compile and pass that to abi function param
		const contract = new web3.eth.Contract(LockContract.abi);

		const deployedContract = await contract
			.deploy({
				data: artifact.bytecode,
				arguments: constructorArgs,
			})
			.send(txOptionsObj);

		// this will be used for sending future transactions to contract for all .send() function calls
		deployedContract.defaultAccount = txOptionsObj.from;
		return deployedContract;
	};

	async function deployOneYearLockFixture() {
		const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
		const ONE_GWEI = 1_000_000_000;

		const lockedAmount = ONE_GWEI;
		const unlockTime = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);

		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await web3.eth.getAccounts();

		const lock = await deployLockContract([unlockTime], {
			value: String(lockedAmount),
		});

		return {
			lock,
			unlockTime,
			lockedAmount,
			owner,
			otherAccount,
			web3,
		};
	}

	describe("Deployment", function () {
		it("Should set the right unlockTime", async function () {
			const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

			expect(await lock.methods.unlockTime().call()).to.equal(unlockTime);
		});

		it("Should set the right owner", async function () {
			const { lock, owner } = await loadFixture(deployOneYearLockFixture);

			expect(await lock.methods.owner().call()).to.equal(owner);
		});

		it("Should receive and store the funds to lock", async function () {
			const { lock, lockedAmount, web3 } = await loadFixture(
				deployOneYearLockFixture,
			);

			expect(await web3.eth.getBalance(String(lock.options.address))).to.equal(
				BigInt(lockedAmount),
			);
		});

		it("Should fail if the unlockTime is not in the future", async function () {
			// We don't use the fixture here because we want a different deployment
			const latestTime = BigInt(await time.latest());

			let thrownError;
			try {
				await deployLockContract([latestTime], {
					value: "1",
				});
			} catch (error) {
				thrownError = error;
			}

			// Assert that an error was actually thrown
			expect(thrownError).to.exist;
			// Now check the properties of the thrown error
			expect(thrownError).to.be.an("error");
			expect((thrownError as ContractExecutionError).cause.message).to.include(
				"Unlock time should be in the future",
			);
		});
	});

	describe("Withdrawals", function () {
		describe("Validations", function () {
			it("Should revert with the right error if called too soon", async function () {
				const { lock } = await loadFixture(deployOneYearLockFixture);

				let thrownError;
				try {
					await lock.methods.withdraw().send();
				} catch (error) {
					thrownError = error;
				}

				expect(
					(thrownError as ContractExecutionError).cause.message,
				).to.include("You can't withdraw yet");
			});

			it("Should revert with the right error if called from another account", async function () {
				const { lock, unlockTime, otherAccount } = await loadFixture(
					deployOneYearLockFixture,
				);

				// We can increase the time in Hardhat Network
				await time.increaseTo(unlockTime);

				let thrownError;
				try {
					await lock.methods.withdraw().send({ from: otherAccount }); // send from other account
				} catch (error) {
					thrownError = error;
				}

				expect(
					(thrownError as ContractExecutionError).cause.message,
				).to.include("You aren't the owner");
			});

			it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
				const { lock, unlockTime } = await loadFixture(
					deployOneYearLockFixture,
				);

				// Transactions are sent using the first signer by default
				await time.increaseTo(unlockTime);

				const tx = await lock.methods.withdraw().send();
				expect(tx.status).to.equal(1n);
			});
		});

		describe("Events", function () {
			it("Should emit an event on withdrawals", async function () {
				const { lock, unlockTime, lockedAmount } = await loadFixture(
					deployOneYearLockFixture,
				);

				await time.increaseTo(unlockTime);

				const withdrawalEventPromise = new Promise((resolve) => {
					lock.events.Withdrawal().on("data", function (event) {
						resolve(event.returnValues.amount);
					});
				});

				const [result, gotLockedAmount] = await Promise.all([
					lock.methods.withdraw().send(),
					withdrawalEventPromise,
				]);

				expect(gotLockedAmount).to.be.equal(BigInt(lockedAmount));
				expect(result.status).to.equal(1n);
			});
		});
	});
});
