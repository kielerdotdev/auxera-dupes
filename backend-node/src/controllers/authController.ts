import { Route, Controller, Get, Request, Delete, Tags } from "tsoa";
import type {
	Request as ExpressRequest,
	Response as ExpressResponse,
} from "express";
import * as steam from "../steam";
import { User, IUserDoc } from "../models/user";
import parse from "cookie";
import { Problem } from "@emoyly/problem";
import { env, loadEnv } from "../env";

loadEnv();
steam.init(`${env.BASE_URL}/api/auth/verify`, env.BASE_URL);

@Tags("Authentication")
@Route("auth")
export class AuthController extends Controller {
	/*
	 * Redirects the user to the steam auth OpenID portal.
	 * Redirects back to /auth/verify when completed.
	 */
	@Get("/")
	public async redirect(@Request() request: ExpressRequest) {
		if (!steam.url) {
			throw "steam controller not initialized yet.";
		}

		const response = (<any>request).res as ExpressResponse;
		response.redirect(steam.url);
	}

	/*Verifies the OpenID data returned from steam*/
	@Get("verify")
	public async verify(@Request() request: ExpressRequest): Promise<void> {
		const steamId64: string = await steam.verify(request.url);
		// this will throw if the request isnt valid...

		// lets create the account if it doesnt exits.
		var user = (await User.findOne({ steamId: steamId64 })) as IUserDoc;
		if (!user) {
			user = await User.createUser(steamId64);
		}

		const refreshToken = await user.createRefreshToken();
		const accessToken: string = await User.refresh(refreshToken);

		//	this.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly`);

		const response = (<any>request).res as ExpressResponse;
		//response.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly`)

		response.cookie("refreshToken", refreshToken, {
			maxAge: 86_400_000,
			httpOnly: true,
			secure: env.NODE_ENV == 'production',
		});

		response.redirect(`${env.BASE_URL}/auth?token=${accessToken}`);
	}

	/*
	 * Returns a new accessToken(JWT) using the http only cookie refreshToken.
	 * requires a "refreshCookie" cookie
	 */
	@Get("/refresh")
	public async refresh(@Request() request: ExpressRequest) {
		const cookiesParsed = parse.parse(request?.headers?.cookie || "");
		if (!cookiesParsed || !cookiesParsed.refreshToken) {
			throw new Problem({
				type: "/auth/refresh",
				title: "Missing RefreshToken cookie",
				status: 403,
			});
		}

		const accessToken: string = await User.refresh(cookiesParsed.refreshToken);
		return accessToken;
	}

	/*Deletes refresh cookie...?*/
	@Delete("/logout")
	public async logout(@Request() request: ExpressRequest) {
		//todo: expire
		const cookiesParsed = parse.parse(request?.headers?.cookie || "");
		if (!cookiesParsed || !cookiesParsed.refreshToken) {
			throw new Problem({
				type: "/auth/logout",
				title: "Missing RefreshToken cookie",
				status: 403,
			});
		}

		//const user = await UserModel.find({accessTokens: cookiesParsed.accessToken})
		//if(user) {
		//	user.accessTokens = user.accessTokens.filter((token: string) => token != user.accessToken)
		//	await user.save()
		//}

		const response = (<any>request).res as ExpressResponse;
		response.clearCookie("refreshToken", {
			httpOnly: true,
		});
	}
}
