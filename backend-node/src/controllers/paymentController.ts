import { Route, Controller, Get, Path, Query, Request, Security, Tags } from "tsoa";
import { Item, IItemDoc } from "../models/item";
import { User, IUserDoc } from "../models/user";
import { Problem, defaults } from "@emoyly/problem";
import { Payment, IPaymentDoc, PaymentState, IPaymentJson } from "../models/payment";
import SteamID from "steamid";
import { giveMoney } from "../stavox";
import { isRefPopulated } from "../utils";

@Tags("Payments")
@Route("payment")
export class IngameController extends Controller {
	/* Returns a list of pending payments*/
	@Security("jwt")
	@Get("/:itemId/status")
	public async Status(
		/**
		 * Returns the state of the itemId for a user. Pending | Owned | None
		 */
		@Path() itemId: string,
		@Request() request: any
	): Promise<PaymentState> {
		const user = (await User.findById(request.user.userId)
			.populate("payments")
			.populate("itemsBought")) as IUserDoc;

		if (!user.payments) {
			return "none";
		}

		const userPayments = user.payments as IPaymentDoc[];

		const paymentItem = userPayments.find((payment) => {
			const item = payment.item as IItemDoc;
			return item._id == itemId;
		});
		if (!paymentItem || paymentItem.state == "rejected") {
			return "none";
		}

		return paymentItem.state;
	}

	@Security("jwt")
	/*Returns a list of pending payments*/
	@Get("/:itemId/buy")
	public async Buy(
		/**
		 * Returns a list of tasks that clients shall execute :p
		 */
		@Path() itemId: string,
		@Request() request: any
	): Promise<string> {
		const user = (await User.findById(request.user.userId)
			.populate("payments")
			.populate("itemsBought")) as IUserDoc;
		if (!user || !user.payments || !user.itemsBought) {
			throw new Problem(defaults.codes4xx["401"]);
		}

		const itemsBought = user.itemsBought as IItemDoc[];

		if (itemsBought.some((item) => item._id == itemId)) {
			throw new Problem({
				type: "/payment/buy",
				status: 403,
				title: "You already own this item...",
				detail: "You already own this item...",
			});
		}

		const userPayments = user.payments as IPaymentDoc[];
		if (
			userPayments.some((payment) => {
				const item = payment.item as IItemDoc;
				return item._id == itemId;
			})
		) {
			throw new Problem({
				type: "/payment/buy",
				status: 403,
				title: "You request item",
				detail: "You request item",
			});
		}

		// lets find the item
		const item = (await Item.findById(itemId)) as IItemDoc;
		if (!item) {
			throw new Problem(defaults.codes4xx["404"]);
		}

		const payment = new Payment();
		payment.item = item;
		payment.price = item?.price || 6969696996;
		payment.state = "pending";
		await payment.save();

		userPayments.push(payment);

		await user.save();

		return "payment done";

		//return payment
	}

	@Security("servertoken")
	@Get("/confirm")
	public async Confirm(
		/**
		 * Returns a list of tasks that clients shall execute :p
		 */
		@Query() paymentId: string,
		@Query() amount: number,
		@Request() request: any
	): Promise<string> {
		console.log("start...?");
		// LOG HERE...

		const steamId = request.user.steamId;

		// lets find the payment..

		const payment = (await Payment.findById(paymentId).populate({
			model: "Item",
			path: "item",
			populate: {
				path: "author",
				model: "User",
				select: "steamId",
			},
		})) as IPaymentDoc;

		//const payment = (await Payment.findById(paymentId).populate(
		//	"item"
		//)) as IPaymentDoc;
		if (!payment) {
			throw `CANT FIND PAYMENT FOR ${steamId} - ${paymentId} - ${amount}`;
		}

		const item = payment.item as IItemDoc;
		if (!item) {
			throw `CANT FIND PAYMENT ITEM FOR ${steamId} - ${paymentId} - ${amount}`;
		}

		if (!isRefPopulated<IUserDoc>(item.author)) {
			throw "Item author is not populated";
		}

		// lets find the user...
		const user = (await User.findOne({ steamId }).populate("itemsBought")) as IUserDoc;
		if (!user) {
			throw `CANT FIND USER FOR ${steamId} - ${paymentId} - ${amount}`;
		}

		if (!user.itemsBought) {
			throw `CANT FIND ITEMS BOUGHT FOR ${steamId} - ${paymentId} - ${amount}`;
		}

		if (payment.price != amount) {
			throw `MISMATCH PAYMENT PRICE FOR ${steamId} - ${paymentId} - GOT PRICE ${amount} - ASKED PRICE ${payment.price}. ØV BØV NU ER DET TRIXX'S PENGE.`;
		}

		if (user.itemsBought?.includes(item._id)) {
			throw "ALREADY OWN ITEM .";
		}

		user.itemsBought.push(item._id);
		await user.save();

		payment.state = "accepted";
		await payment.save();

		const sid = new SteamID(item.author.steamId);
		const authorSteamId32 = sid.getSteam2RenderedID();

		const split: [string, number][] = [
			[authorSteamId32, 90],
			["STEAM_0:1:87250278", 3],
			["STEAM_0:0:36156675", 3],
		];

		console.log("payment....", authorSteamId32);

		for (const [steamId, percentage] of split) {
			const cut = Math.floor((amount / 100) * percentage);
			giveMoney(steamId, cut);
		}

		return "hi buy";
	}

	@Security("servertoken")
	/*Returns a list of pending payments*/
	@Get("awaiting")
	public async UserPayments(@Request() request: any): Promise<Array<IPaymentJson>> {
		const user = (await User.findOne({
			steamId: request.user.steamId,
		}).populate({
			model: "Payment",
			path: "payments",
			populate: {
				path: "item",
				model: "Item",
			},
		})) as IUserDoc;
		if (!user?.payments) {
			throw new Problem(defaults.codes4xx["401"]);
		}

		const out: IPaymentJson[] = [];
		const payments = user.payments as IPaymentDoc[];
		for (const payment of payments) {
			if (payment.state == "pending") {
				const item = payment.item as IItemDoc;
				if (!item) {
					continue;
				}

				out.push({
					id: payment._id,
					item: {
						title: item.title,
					},
					price: payment.price,
					createdAt: payment.createdAt,
					state: payment.state,
				});
			}
		}

		return out;
	}
}
