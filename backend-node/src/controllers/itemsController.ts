import {
	Route,
	Controller,
	Get,
	Post,
	Put,
	Path,
	Query,
	Request,
	Security,
	Tags,
	Body,
	BodyProp,
} from "tsoa";
import type { Request as exRequest } from "express";
import { IItemDoc, Item, ItemJson, ItemType } from "../models/item";
import { User, IUserDoc } from "../models/user";
import { generateToken, streamToBase64 } from "../utils";
import { Problem, defaults } from "@emoyly/problem";
import mongoose from "mongoose";
import { promises as fsp } from "fs";

const toGet = [
	"type",
	"title",
	"name",
	"tags",
	"steamId",
	"description",
	"images",
	"versions.version",
	"versions.createdAt",
	"price",
	"roles",
];

interface IDownload {
	type: ItemType;
	content: string;
}

interface ICreateItemBody {
	type: ItemType;
	title: string;
	price: number;
	description: string;

	/** List of images in base64 */
	images: string[];

	/** List of tags */
	tags?: string[];
}

const extentionTypes: { [key: string]: string } = {
	"image/jpeg": "jpg",
	"image/gif": "gif",
	"image/png": "png",
};

const clamp = function (number: number, min: number, max: number) {
	return Math.max(min, Math.min(number, max));
};

const allowedTags = ["bank", "politi", "gunshop", "homeless"];

@Tags("Items")
@Route("items")
export class ItemsController extends Controller {
	@Security("jwt", ["author"])
	@Post("/")
	public async CreateItem(
		@Request() request: exRequest,
		@Body() body: ICreateItemBody
	): Promise<string | void> {
		const item = new Item();

		const images = [];
		for (const imageBase64Index in body.images) {
			const imageBase64 = body.images[imageBase64Index];

			console.log("looping images");
			const matchedImage = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
			if (!matchedImage) {
				continue;
			}

			const imageData: string = matchedImage[2];
			const imageType: string = matchedImage[1];

			const fileExtention = extentionTypes[imageType];
			if (!fileExtention) {
				throw new Problem({
					status: 403,
					type: "/items/uploadimagebase64create",
					title: "Invalid base64 image provided",
					detail: `image index: ${imageBase64Index}`,
				});
			}

			const image = Buffer.from(imageData, "base64");
			const fileToken = await generateToken(16);
			const fileName = `${fileToken}.${fileExtention}`;

			await fsp.writeFile(`/app/images/${fileName}`, image);

			images.push(fileName);
		}

		if (body.tags?.some((tag) => !allowedTags.includes(tag))) {
			throw new Problem(defaults.codes4xx["400"]);
		}

		if (body.price % 10000 !== 0) {
			throw new Problem(defaults.codes4xx["400"]);
		}

		item.author = mongoose.Types.ObjectId(request.user.userId);
		item.title = body.title;
		item.type = body.type;
		item.price = clamp(body.price, 10000, 100000000);
		item.description = body.description;
		item.tags = body.tags; // todo: validate tags.
		item.images = images;
		item.versions = [];
		item.disabled = {
			user: mongoose.Types.ObjectId(request.user.userId),
			type: "normal",
		};

		await item.save();

		// add the item to the users bought items

		//@ts-ignore
		const user = (await User.findById(request.user.userId)) as IUserDoc;
		if (user) {
			user.itemsBought?.push(item._id);
			await user.save();
		}

		return item._id;
	}

	/**
	 * Returns a list of your items
	 * @isInt skip
	 * @isInt limit
	 */
	@Security("jwt")
	@Get("/me")
	public async MyItems(
		@Request() req: exRequest,
		/**Index to start from.*/
		@Query() skip?: number,
		/**Filters the query by title.*/
		@Query() query?: string,
		/**Filters the query by item type.*/
		@Query() filter?: ItemType,
		/**Limits the amount of items to get.*/
		@Query() limit?: number
	): Promise<Array<ItemJson>> {
		const _query: any = {
			author: mongoose.Types.ObjectId(req.user?.userId),
		};
		if (query) {
			_query["title"] = new RegExp(query, "i");
		}
		if (filter) {
			_query["type"] = filter;
		}

		const found = await Item.find(_query, toGet, {
			limit: limit ?? 100,
			skip: skip ?? 0,
		})
			.populate("author", toGet)
			.populate("disabled", toGet);

		//@ts-ignore
		return found;
	}

	/**
	 * Returns a list of items
	 * @isInt skip
	 * @isInt limit
	 */
	@Get("/")
	public async List(
		@Request() req: exRequest,
		/**Index to start from.*/
		@Query() skip?: number,
		/**Filters the query by title.*/
		@Query() query?: string,
		/**Filters the query by item type.*/
		@Query() filter?: ItemType,
		/**Limits the amount of items to get.*/
		@Query() limit?: number
	): Promise<Array<ItemJson>> {
		const _query: any = {};

		// if we're not an admin, restrict what we can see.
		if (!req?.user?.roles.includes("admin")) {
			// we should only be able to see, things we created.
			_query["$or"] = [
				{ author: { $eq: req?.user?.userId || null } },
				{ disabled: { $exists: false } },
			];
		}

		if (query) {
			_query["title"] = new RegExp(query, "i");
		}

		if (filter) {
			_query["type"] = filter;
		}

		const found = await Item.find(_query, toGet, {
			limit: limit ?? 100,
			skip: skip ?? 0,
		})
			.populate("author", toGet)
			.populate("disabled", toGet);

		//@ts-ignore
		return found;
	}

	@Security("jwt", ["author"])
	@Put("/:itemId")
	public async PutItem(@Path() itemId: string, @Request() request: any): Promise<string> {
		const userId = mongoose.Types.ObjectId(request.user.userId);

		return "yas";
	}

	@Get("/:itemId")
	public async GetItem(@Path() itemId: string): Promise<ItemJson> {
		const found = await Item.findById(itemId, toGet)
			.populate("author", toGet)
			.populate("disabled", toGet);
		if (!found) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		//@ts-ignore
		return found;
	}

	@Security("jwt")
	@Post("/toggleenabled/:itemId")
	public async ToggleEnabled(@Path() itemId: string, @Request() req: exRequest): Promise<ItemJson> {
		const item = await Item.findById(itemId, toGet).populate("author", toGet).populate("disabled");
		if (!item) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		const isDisabled = (item: IItemDoc) => item.disabled?.type && item.disabled?.user;

		const canEnable = (item: any) => {
			if (req.user?.userId != item.author?._id) {
				return false;
			}

			if (!isDisabled(item)) {
				return true;
			}

			return item.disabled.type == "normal";
		};

		if (!canEnable(item)) {
			throw new Problem(defaults.codes4xx["401"]);
		}

		if (isDisabled(item)) {
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
		} else {
			item.disabled = {
				user: mongoose.Types.ObjectId(req.user.userId),
				type: "normal",
			};
		}

		await item.save();

		//@ts-ignore
		return item;
	}

	@Security("jwt")
	@Security("servertoken")
	@Get("/:itemId/download")
	public async Download(
		/*Returns a base64 string of the item's content.*/
		@Path() itemId: string,
		@Request() req: exRequest
	): Promise<IDownload> {
		const user = (await User.findById(req.user?.userId).populate({
			select: [...toGet, ...["versions.data"]],
			model: "Item",
			path: "itemsBought",
		})) as IUserDoc;

		if (!user || !user.itemsBought) {
			throw new Problem(defaults.codes4xx["401"]);
		}

		const boughtItems = user.itemsBought as IItemDoc[];
		const item = boughtItems.find((item: IItemDoc) => {
			return item._id == itemId;
		}) as IItemDoc;
		if (!item || !item.versions) {
			throw new Problem(defaults.codes4xx["401"]);
		}
		if (item.versions.length == 0) {
			throw new Problem(defaults.codes4xx["401"]);
		}

		const version = item.versions.reduce((current, version) => {
			if (!current) {
				return version;
			}

			if (!version.createdAt || !current.createdAt) {
				return current;
			}

			return version.createdAt > current.createdAt ? version : current;
		});
		if (!version) {
			throw new Problem(defaults.codes4xx["401"]);
		}

		return {
			content: version.data,
			type: item.type,
		};
	}
}
