import fs = require("fs");
import jwt from "jsonwebtoken";
import Mustache from "mustache";

export async function RegisterPatient(
	web3: any,
	abiPath: string,
	deployedAddress: string,
	patientAccount: string,
	name: string,
	dob: string,
) {
	const deployedContent = fs.readFileSync(deployedAddress, "utf8");

	const abi = require(abiPath);
	const registerDoc = new web3.eth.Contract(abi, deployedContent);
	registerDoc.handleRevert = true;

	const accounts = await web3.eth.getAccounts();
	const defaultAccount = accounts[0];

	try {
		await registerDoc.methods.registerPatient(name, dob).send({
			from: defaultAccount,
			gas: 1000000,
			gasPrice: "10000000000",
		});

		//const info = await registerDoc.methods.getPatient(patientAccount).call();
		//console.log("Patient Registration Successful! Patient Info:\n", info);
	} catch (error) {
		console.error(error);
	}
}

export async function RegisterDoctor(
	web3: any,
	abiPath: string,
	deployedAddress: string,
	doctorAccount: string,
	username: string,
	name: string,
	phoneNumber: string,
	dob: string,
	image: string,
	email: string,
	education: string,
	title: string,
) {
	const deployedContent = fs.readFileSync(deployedAddress, "utf8");

	const abi = require(abiPath);
	const registerDoc = new web3.eth.Contract(abi, deployedContent);

	registerDoc.handleRevert = true;

	const accounts = await web3.eth.getAccounts();
	const defaultAccount = accounts[0];

	try {
		await registerDoc.methods
			.registerDoctor(
				doctorAccount,
				username,
				name,
				image,
				dob,
				phoneNumber,
				email,
				education,
				title,
			)
			.send({
				from: defaultAccount,
				gas: 1000000,
				gasPrice: "10000000000",
			});

		const info = await registerDoc.methods.getDoctor(doctorAccount).call();

		console.log("Here lies the info:\n", info);
	} catch (error) {
		console.error(error);
	}
}

export function regForm(isDoctor: boolean, templateString: string): string {
	const data = {
		is_doctor: isDoctor,
		is_register: true,
		title: isDoctor ? "Doctor Register" : "Patient Register",
	};

	return Mustache.render(templateString, data);
}

export async function docForm(
	web3: any,
	abiPath: string,
	deployedAddress: string,
	templateString: string,
	req: Request,
): Promise<[string, string]> {
	const formData = await req.formData();
	const name: string = formData.get("name")?.toString() || "";
	const address: string = formData.get("address")?.toString() || "";
	const username: string = generateUsername(name);
	const phone: string = formData.get("phone")?.toString() || "";
	const dob: string = formData.get("dob")?.toString() || "";
	const email: string = formData.get("email")?.toString() || "";
	const title: string = formData.get("title")?.toString() || "";
	const education: string = formData.get("education")?.toString() || "";

	console.log("Received Registration Details:", {
		name,
		username,
		phone,
		dob,
	});

	RegisterDoctor(
		web3,
		abiPath,
		deployedAddress,
		address,
		username,
		name,
		phone,
		dob,
		"??",
		email,
		education,
		title,
	);

	const token = generateJWT(username);

	const data = {
		is_doctor: true,
		title: "Signed in!",
		is_register: false,
		message: "Signed in succcess",
		is_cookie: true,
		token: `"_user_loggedin=${token}; Path=/; Secure; SameSite=Strict"`,
		username: username,
	};

	const page: string = Mustache.render(templateString, data);

	return [
		page,
		'"Set-Cookie": `_user_loggedin=${token}; Path=/; Secure; SameSite=Strict`',
	];
}

export async function patientForm(
	web3: any,
	abiPath: string,
	deployedAddress: string,
	templateString: string,
	req: Request,
): Promise<[string, string]> {
	const formData = await req.formData();
	const name: string = formData.get("name")?.toString() || "";
	const patientAccount: string = formData.get("address")?.toString() || "";
	const dob: string = formData.get("dob")?.toString() || "";
	const address: string = formData.get("address")?.toString() || "";

	console.log("Received Patient Registration Details:", {
		name,
		patientAccount,
		dob,
	});

	RegisterPatient(web3, abiPath, deployedAddress, patientAccount, name, dob);

	const username: string = generateUsername(name);
	const token = generateJWT(username);

	const data = {
		is_doctor: false,
		title: "Signed in!",
		is_register: false,
		message: `Patient registered successfully, use ${username} for public use`,
		is_cookie: true,
		token: `"_user_loggedin=${token}; Path=/; Secure; SameSite=Strict"`,
		username: username,
	};

	const page: string = Mustache.render(templateString, data);

	return [
		page,
		'"Set-Cookie": `_user_loggedin=${token}; Path=/; Secure; SameSite=Strict`',
	];
}

export function generateJWT(userId: string): string {
	const JWT_SECRET: string =
		process.env.JWT_SECRET || "default_secret_key_for_now_should_be_secret";
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7h" });
}

function generateUsername(name: string) {
	// split the name using spaces
	const names = name.split(" ");
	let username = "";

	if (names.length == 0) {
		return names[0].toLowerCase();
	}

	for (let i = 0; i < names.length; i++) {
		// Pick the first letter only (may not be unicode friendly)
		if (i == 0) {
			username += name[i][0];
			continue;
		}

		username += names[i].toLowerCase();
	}

	return username;
}
