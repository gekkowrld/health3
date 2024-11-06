import Mustache from "mustache";

export function IndexPage(
	templateString: string,
	is_loggedin: boolean,
): [string, number] {
	let index: string = "";
	let status: number = 200;

	const data = {
		is_loggedin: is_loggedin,
		address: "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
	};

	index = Mustache.render(templateString, data);

	return [index, status];
}
