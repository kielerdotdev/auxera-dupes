import type {
	Request as ExRequest,
	Response as ExResponse,
	NextFunction as ExNext,
} from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import { Problem } from "@emoyly/problem";
import { IUserJWT } from "../models/user";

const privateKey = fs.readFileSync("/app/private.key");

interface ReqUser {
	name: string;
	roles: string[];
	steamId: string;
	userId: string;
}

declare global {
	namespace Express {
		interface Request {
			user: ReqUser;
		}
	}
}

export default async (req: ExRequest, _res: ExResponse, next: ExNext) => {
	const header =
		(req?.query?.token && `Bearer ${req.query.token}`) ??
		req.headers.authorization;

	if (!header) {
		next();
		return;
	}

	try {
		const matches = header.match(/^Bearer (.*?)$/);

		if (!matches) {
			throw new Problem({
				type: "/auth/missingjwt",
				title: "Invalid authorization header.",
				status: 401,
			});
		}

		const [, token] = matches;
		if (!token) {
			throw new Problem({
				type: "/auth/missingjwt",
				title: "Missing authorization token.",
				status: 401,
			});
		}

		try {
			req.user = await new Promise((resolve, reject) => {
				jwt.verify(
					token,
					privateKey,
					{ algorithms: ["RS256"] },
					(err, token) => {
						if (err) {
							return reject(err);
						}

						return resolve(token as IUserJWT);
					}
				);
			});
		} catch (err) {
			const detail = err?.message ?? "No error details provided.";

			throw new Problem({
				type: "/auth/invalidjwt",
				title: "Invalid authorization.",
				status: 401,
				detail: detail,
			});
		}
	} catch (err) {
		next(err);
	}

	next();
};
