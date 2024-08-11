import type { Request } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import { Problem } from "@emoyly/problem";
import { IUserJWT, User, IUserDoc } from "./models/user";
import {env} from './env'



export async function expressAuthentication(
	request: Request,
	securityName: string,
	scopes?: string[]
): Promise<any> {
	if (securityName == 'jwt') {
		if(!request.user) {
			throw new Problem({
				type: "/auth/invalidjwt",
				title: "Invalid authorozation.",
				status: 401,
				detail: `Auth token or Baerer missing`,
			});
		}

		if (scopes) {
			const missingScopes = scopes.filter(
				(scope) => !request.user.roles.includes(scope)
			);
			if (missingScopes.length > 0) {
				throw new Problem({
					type: "/auth/invalidjwtscopes",
					title: "Invalid authorozation - Missing required scopes.",
					status: 401,
					detail: `scopes missing: ${missingScopes.join(", ")}`,
				});
			}
		}

		return request.user
	}else if (securityName == "servertoken") {
		const api_key = request.body.api_key ?? request.query.api_key;
		if (api_key != env.API_KEY) {
			throw new Problem({
				type: "/auth/invalidapi_keyn",
				title: "Invalid server api_key.",
				status: 401,
				detail: "Invalid api key",
			});
		}

		const steamId = request.body.__steamId ?? request.query.__steamId;
		const user = (await User.findOne({ steamId })) as IUserDoc;
		if (!user) {
			throw new Problem({
				type: "/auth/invaliduser",
				title: "Provided steamId does not exist.",
				status: 403,
				detail: "Provided steamId does not exist",
			});
		}

		return {
			name: user.name,
			roles: user.roles,
			steamId: user.steamId,
			userId: user._id,
		};
	}

	return Promise.reject();
}
