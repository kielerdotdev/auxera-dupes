import {
	Route,
	Controller,
	Patch,
	Post,
	Delete,
	Path,
	Query,
	Request,
	Security,
	Tags,
	Body,
} from "tsoa";
import type { Request as exRequest } from "express";
import { IItemDoc, Item } from "../models/item";
import { Problem, defaults } from "@emoyly/problem";
import mongoose from "mongoose";
import { handle as handleObfuscate, getHash } from "../obfuscator";

interface ICreateItemVersionBody {
	/** The E2 or dupe data in base64 */
	data: string;
	version: string;
	security?: boolean;
	securityData?: string;
	obfuscate?: boolean;
}

@Tags("Item Versions")
@Route("items")
export class VersionController extends Controller {
	@Security("jwt", ["author"])
	@Post("/:itemId/versions")
	public async CreateVersion(
		@Path() itemId: string,
		@Request() request: exRequest,
		@Body() body: ICreateItemVersionBody
	): Promise<void> {
		const foundItem = (await Item.findById(itemId)) as IItemDoc;
		if (!foundItem) {
			throw new Problem({
				title: "No Item",
				detail: `Could not the find item with ID "${itemId}"`,
				status: 404,
				type: "/",
			});
		}

		const userId = mongoose.Types.ObjectId(request.user.userId);
		if (!userId.equals(foundItem.author as mongoose.Types.ObjectId)) {
			throw new Problem({
				title: "Forbidden",
				detail: "You do not have access to create a version for this item",
				status: 403,
				type: "/",
			});
		}

		let authData: any = {};
		let data = body.data.replace("data:text/plain;base64,", "");
		if (foundItem.type == "e2") {
			const e2Buffer = Buffer.from(data, "base64");
			let e2 = e2Buffer.toString("utf8");

			if (body.obfuscate) {
				if (!request.user.roles.includes("obfuscate")) {
					throw new Problem({
						title: "Unauthorized",
						detail: "Missing 'obfuscate' role",
						status: 401,
						type: "/",
					});
				}

				const obfuscatedE2 = await handleObfuscate(e2);
				e2 = obfuscatedE2.code;
			}

			if (body.security) {
				if (!request.user.roles.includes("security")) {
					throw new Problem({
						title: "Unauthorized",
						detail: "Missing 'security' role",
						status: 401,
						type: "/",
					});
				}

				authData = {
					authData: body.securityData,
					authHash: await getHash(e2),
				};
			}

			const e2BufferEdited = Buffer.from(e2);
			data = e2BufferEdited.toString("base64");
		}

		foundItem.versions.push({
			...authData,
			version: body.version,
			data: data,
		});

		await foundItem.save();
		return foundItem._id;
	}

	@Security("jwt", ["author"])
	@Patch("/:itemId/versions/:version")
	public async DisableVersion(
		/*ID of the item to patch a version of*/
		@Path() itemId: string,

		/*Version name to patch from item*/
		@Path() version: string,

		/*Disabled state.*/
		@Query() disabled: boolean,

		@Request() request: any
	): Promise<void> {
		const userId = mongoose.Types.ObjectId(request.user.userId);
		const foundItem = (await Item.findOne({
			_id: itemId,
			author: userId,
			"versions.version": version,
		})) as IItemDoc;

		if (!foundItem) {
			throw new Problem(defaults.codes4xx["403"]);
		}

		const foundVersion = foundItem.versions.find((iversion) => iversion.version == version);

		if (!foundVersion) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		foundVersion.disabled = disabled;

		await foundItem.save();
	}

	@Security("jwt", ["admin"])
	@Delete("/:itemId/versions/:version")
	public async DeleteVersion(
		@Path() itemId: string,
		@Path() version: string,

		@Request() request: any
	): Promise<void> {
		await Item.deleteOne({
			_id: itemId,
			"versions.version": version,
		});
	}
}
