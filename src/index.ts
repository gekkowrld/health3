import Mustache from "mustache";

export function IndexPage(
	templateString: string,
	jwt_auth: any,
	is_loggedin: boolean,
): [string, number] {
	let index: string = "";
	let status: number = 200;
	let username: string = "";

	try {
		const userId = jwt_auth.userId || "";
		username = userId;
	} catch (_) {}

	const data = {
		is_loggedin: is_loggedin,
		username,
	};

	index = Mustache.render(templateString, data);

	return [index, status];
}
