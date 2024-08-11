import {
	Route,
	Controller,
	Post,
	Body,
	Request,
	Path,
	Security,
	Tags,
} from "tsoa";
import { ItemJson } from "../models/item";
import { User, IUserDoc } from "../models/user";
import { Item, IItemDoc } from "../models/item";
import { Problem, defaults } from "@emoyly/problem";
import type { Request as exRequest } from "express";
import mongoose from "mongoose";

const allowedRoles = ["author", "obfuscate", "security", "admin"];

@Security("jwt", ["admin"])
@Route("admin")
export class AdminController extends Controller {
	@Tags("Admin - Item")
	@Post("/items/toggleenabled/:itemId")
	public async ToggleEnabled(
		@Path() itemId: string,
		@Request() req: exRequest
	): Promise<ItemJson> {
		const toGet = [
			"type",
			"title",
			"name",
			"steamId",
			"description",
			"images",
			"versions.version",
			"versions.createdAt",
			"price",
			"roles",
		];

		const item = await Item.findById(itemId, toGet)
			.populate("author", toGet)
			.populate("disabled");
		if (!item) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		const isDisabled = (item: IItemDoc) =>
			item.disabled?.type && item.disabled?.user;

		if (isDisabled(item)) {
			if (item.disabled?.type == "normal") {
				item.disabled = {
					user: mongoose.Types.ObjectId(req.user.userId),
					type: "forced",
				};
			} else {
				// the item is disabled. Lets check if a version exists.
				if (!item.versions || item.versions.length < 1) {
					throw new Problem({
						type: "/items/create/needversion",
						status: 403,
						detail: "The item needs a version, before it can be activated",
						title: "Version Missing. Please create it before activating.",
					});
				}

				item.disabled = undefined;
			}
		} else {
			item.disabled = {
				user: mongoose.Types.ObjectId(req.user.userId),
				type: "forced",
			};
		}

		await item.save();

		//@ts-ignore
		return item;
	}

	@Tags("Admin - User")
	@Post("/users/:userId/roles")
	public async UpdateRoles(
		@Path() userId: string,
		@Body() body: { roles: string[] },
		@Request() req: exRequest
	): Promise<void> {
		const toGet = ["roles"];

		const user = await User.findById(userId, toGet);
		if (!user) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		if (!body.roles) {
			throw new Problem(defaults.codes4xx["400"]);
		}

		if (body.roles.some((role) => !allowedRoles.includes(role))) {
			throw new Problem(defaults.codes4xx["400"]);
		}

		user.roles = body.roles;

		await user.save();
	}
}
