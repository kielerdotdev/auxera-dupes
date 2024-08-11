import mongoose from "mongoose";
import { IItemDoc } from "./item";
import { IPaymentDoc } from "./payment";
import { generateToken } from "../utils";
import jwt from "jsonwebtoken";
import fs from "fs";
import { getUser as getSteamUser } from "../steamApi";

export interface IUserAuthData {
	name: string;
	steamId: string;
	roles: string[];
	userId: string;
}

export interface IUserJWT extends IUserAuthData {
	iat: Date;
	exp: Date;
}

const privateKey = fs.readFileSync("./private.key");
const publicKey = fs.readFileSync("./public.key");

export interface IUser {
	name: string;
	steamId: string;
	roles?: string[];
	refreshTokens?: string[];
	itemsBought?: mongoose.Types.ObjectId[] | IItemDoc[];
	payments?: mongoose.Types.ObjectId[] | IPaymentDoc[];
}

export interface IUserDoc extends IUser, mongoose.Document {
	createRefreshToken(): Promise<string>;
}

export interface IUserModel extends mongoose.Model<IUserDoc> {
	refresh(refreshToken: string): Promise<string>;
	createUser(steamId64: string): Promise<IUserDoc>;
}

const UserSchemaFields: Record<keyof IUser, any> = {
	name: {
		type: String,
		required: true,
	},
	steamId: {
		type: String,
		required: true,
		unique: true,
	},
	roles: [
		{
			type: String,
		},
	],
	refreshTokens: [
		{
			type: String,
		},
	],
	itemsBought: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Item",
		},
	],
	payments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Payment",
		},
	],
};

export const UserSchema = new mongoose.Schema<IUserDoc, IUserModel>(
	UserSchemaFields
);

UserSchema.methods.createRefreshToken = async function (save: boolean = true) {
	const token = await generateToken(64);
	this.refreshTokens?.push(token);

	if (save) {
		await this.save();
	}

	return token;
};

UserSchema.statics.refresh = async (refreshToken: string) => {
	const userFound = await User.findOne({ refreshTokens: refreshToken });
	if (!userFound) {
		throw "invalid_refresh_token";
	}

	const toSign = {
		name: userFound.name,
		steamId: userFound.steamId,
		roles: userFound.roles,
		userId: userFound._id,
	};

	const token = await jwt.sign(toSign, privateKey, {
		algorithm: "RS256",
		expiresIn: "15m",
	});
	return token;
};

UserSchema.statics.createUser = async (steamId64: string) => {
	const user = new User();
	const userInfo = await getSteamUser(steamId64);

	user.name = userInfo.personaname;
	user.refreshTokens = [];
	user.steamId = steamId64;
	user.itemsBought = [];
	user.roles = [];

	await user.save();

	return user;
};

export const User = mongoose.model<IUserDoc, IUserModel>("User", UserSchema);
