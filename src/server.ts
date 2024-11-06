import fs = require("fs");
import path = require("path");
import { IndexPage } from "./index";
import { CookieUtils } from "./auth";
import { NotFound } from "./notFound";
import { docForm, regForm } from "./register";
import jwt from "jsonwebtoken";

export async function Page(
	web3: any,
	abiPath: string,
	deployedAddress: string,
	request: Request,
): Promise<Response> {
	const page = new URL(request.url).pathname;
	let pageContent: string = "";
	let status: number = 200;
	const logged_in_cookie: string = "_user_loggedin";

	const cookiesHeader = request.headers.get("Cookie");

	const authToken = CookieUtils.getCookie(logged_in_cookie, cookiesHeader);
	let is_loggedin: boolean = false;

	// This means an auth token is there, still exclude the reg pages
	if (verifyJWT(authToken || "")) {
		is_loggedin = true;
	}

	// Handle /resources seperately

	if (page.startsWith("/resources/")) {
		return new Response(RetrieveResources(page), {
			headers: { "Content-Type": content_type(page) },
			status: 200,
		});
	}

	switch (page) {
		case "/":
			const val = IndexPage(openFile("index.mustache"), is_loggedin);
			pageContent = val[0];
			status = val[1];
			return new Response(pageContent, {
				headers: { "Content-Type": "text/html" },
				status: status,
			});

		case "/doctor_register":
			return new Response(regForm(true, openFile("register.mustache")), {
				headers: { "Content-Type": "text/html" },
				status: 200,
			});

		//case "/doctor_login":
		case "/doctor_register_info":
			const [pg, gt] = await docForm(
				web3,
				abiPath,
				deployedAddress,
				openFile("register.mustache"),
				request,
			);
			return new Response(pg, {
				headers: { "Content-Type": "text/html", gt },
				status: 201,
			});

		default:
			return new Response(NotFound(openFile("notFound.mustache")), {
				headers: { "Content-Type": "text/html" },
				status: 404,
			});
	}
}

function content_type(filename: string): string {
	// List from https://stackoverflow.com/a/48704300
	switch (path.extname(filename)) {
		case ".png":
			return "image/png";
		case ".css":
			return "text/css";
		case ".html":
			return "text/html";
		default:
			return "text/plain";
	}
}

function RetrieveResources(resource_path: string): any {
	// Split using / (after removing the leading '/')
	let paths: string[] = resource_path.slice(1).split("/").slice(1);
	paths.unshift("res");

	// Now read the data and return it

	const on_disk: string = path.join(path.dirname(__dirname), ...paths);
	return fs.readFileSync(on_disk);
}

function verifyJWT(token: string): any {
	try {
		const JWT_SECRET =
			process.env.JWT_SECRET || "default_secret_key_for_now_should_be_secret";
		return jwt.verify(token, JWT_SECRET);
	} catch (err) {
		return null; // Return null if verification fails
	}
}

function openFile(filename: string) {
	let fileContent: string = "";

	fileContent = fs.readFileSync(path.join(__dirname, filename)).toString();

	return fileContent;
}
