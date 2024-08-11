import { Route, Controller, Get, Request, Security, Tags } from "tsoa";
import { ItemJson } from "../models/item";
import { User } from "../models/user";
import { Problem, defaults } from "@emoyly/problem";
import type { Request as exRequest } from "express";

const toGet = ["_id", "name", "steamId", "roles", "title"];

@Tags("User")
@Route("user")
export class UserController extends Controller {
	@Security("jwt")
	@Security("servertoken")
	@Get("bought")
	public async UserItems(
		/*Returns a list of bought items.*/
		@Request() req: exRequest
	): Promise<Array<ItemJson>> {
		const found = await User.findById(req.user.userId).populate({
			select: toGet,
			model: "Item",
			path: "itemsBought",
			populate: {
				path: "author",
				model: "User",
				select: toGet,
			},
		});

		if (!found) {
			throw new Problem(defaults.codes4xx["401"]);
		}

		//@ts-ignore
		return found.itemsBought;
	}
}
