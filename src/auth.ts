import jwt from "jsonwebtoken";

interface Cookies {
	[key: string]: string;
}

export class CookieUtils {
	static getCookie(
		name: string,
		cookieHeader: string | null,
	): string | undefined {
		const cookies = CookieUtils.parseCookies(cookieHeader);
		return cookies[name];
	}

	static setCookie(name: string, value: string, maxAge: number = 3600): string {
		return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict`;
	}

	static parseCookies(cookieHeader: string | null): Cookies {
		const cookies: Cookies = {};

		if (cookieHeader) {
			cookieHeader.split(";").forEach((cookie) => {
				const [name, value] = cookie.trim().split("=");
				if (name && value) {
					cookies[name] = value;
				}
			});
		}

		return cookies;
	}
}
