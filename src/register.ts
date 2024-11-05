import fs = require("fs");

export const registerFormHTML = `
  <html>
    <head>
      <title>Register</title>
    </head>
    <body>
      <h1>Register</h1>
      <form action="/register-doc" method="POST">
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" required/><br><br>
        
        <label for="phone">Phone:</label>
        <input type="text" id="phone" name="phone" required/><br><br>

        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required/><br><br>

        <label for="title">Title:</label>
        <input type="text" id="title" name="title" required/><br><br>

        <label for="education">Education:</label>
        <input type="text" id="education" name="education" required/><br><br>

        <label for="dob">Date of Birth:</label>
        <input type="date" id="dob" name="dob" required/><br><br>

        <button type="submit">Register</button>
      </form>
    </body>
  </html>
`;

export async function RegisterDoctor(
	web3: any,
	abiPath: string,
	deployedAddress: string,
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
	const doctorAccount = accounts[1];
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

		console.log(
			"Here lies the info:\n", info);
	} catch (error) {
		console.error(error);
	}
}