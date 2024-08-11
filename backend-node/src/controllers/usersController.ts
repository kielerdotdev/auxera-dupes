import {
	Route,
	Controller,
	Get,
	Request,
	Query,
	Path,
	Security,
	Tags,
} from "tsoa";
import { User } from "../models/user";
import { Problem, defaults } from "@emoyly/problem";
import type { Request as exRequest } from "express";

const toGet = ["_id", "name", "steamId", "roles"];
interface IUserJson {
	_id: string;
	name: string;
	steamId: string;
	roles: string[];
}

@Tags("Users")
@Route("users")
export class UsersController extends Controller {
	/**
	 * Returns a list of items
	 * @isInt skip
	 * @isInt limit
	 */
	@Get("/")
	public async GetUsers(
		@Request() req: exRequest,
		/**Index to start from.*/
		@Query() skip?: number,
		/**Filters the query by title.*/
		@Query() query?: string,
		/**Limits the amount of items to get.*/
		@Query() limit?: number
	): Promise<Array<IUserJson>> {
		if (query) {
			const regexQuery = new RegExp(query);

			const found = await User.find(
				{
					$or: [
						{ name: { $regex: regexQuery } },
						{ steamId: { $regex: regexQuery } },
					],
				},
				toGet,
				{
					limit: limit ?? 20,
					skip: skip ?? 0,
				}
			);

			if (!found) {
				throw new Problem(defaults.codes4xx["404"]);
			}

			//@ts-ignore
			return found;
		}

		const found = await User.find({}, toGet, {
			limit: limit ?? 20,
			skip: skip ?? 0,
		});

		if (!found) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		//@ts-ignore
		return found;
	}

	/**
	 * Returns a list of items
	 * @isInt skip
	 * @isInt limit
	 */
	@Get("/:userId")
	public async GetUser(
		@Path() userId: string,
		@Request() req: exRequest
	): Promise<IUserJson> {
		const found = await User.findById(userId, toGet);

		if (!found) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		//@ts-ignore
		return found;
	}
}
