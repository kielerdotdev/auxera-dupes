import { Route, Controller, Get, Patch, Path, Query, Request, Security, Post, Tags } from "tsoa";
import { IItemDoc, Item } from "../models/item";
import { User, IUserDoc } from "../models/user";
import { Problem, defaults } from "@emoyly/problem";

@Tags("Item Auth")
@Route("items/auth")
export class ItemAuthController extends Controller {
	// @Security("servertoken")
	@Get("/")
	public async AuthItem(
		/** The user's steamId to check if they own the item. */
		@Query() steamId: string,
		/** The unique E2 hash, this is used to find the Item, and to verify it has not been modified. */
		@Query() hash: string
	): Promise<string> {
		const item = await Item.findOne({ "versions.authHash": hash });
		if (!item?.versions) {
			console.log("invalid version???", item, item);
			throw new Problem(defaults.codes4xx["404"]);
		}

		const version = item.versions.find((version) => version.authHash == hash);
		if (!version?.authData) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		const user = await User.findOne({ steamId });
		if (!user?.itemsBought) {
			throw new Problem(defaults.codes4xx["401"]);
		}

		const bought = user.itemsBought.includes(item._id);
		if (!bought) {
			throw new Problem(defaults.codes4xx["403"]);
		}

		return `${Buffer.from(version.authData).toString("base64")}`;
	}
}
