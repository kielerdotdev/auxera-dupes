import mongoose from "mongoose";
import { IItemDoc } from "./item";

const PaymentStates = ["pending", "rejected", "accepted", "none"];
export type PaymentState = "pending" | "rejected" | "accepted" | "none";

export interface IPaymentJson {
	item: {
		title: string;
	};
	price: number;
	createdAt: Date;
	state: PaymentState;
	id: string;
}

export interface IPayment {
	item: mongoose.Types.ObjectId | IItemDoc;
	price: number;
	createdAt: Date;
	state: PaymentState;
}

export interface IPaymentDoc extends IPayment, mongoose.Document {}
export interface IPaymentModel extends mongoose.Model<IPaymentDoc> {}

const PaymentSchemaFields: Record<keyof IPayment, any> = {
	item: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Item",
	},
	price: {
		type: Number,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	state: {
		type: String,
		enum: PaymentStates,
		required: true,
	},
};

export const PaymentSchema = new mongoose.Schema<IPaymentDoc, IPaymentModel>(
	PaymentSchemaFields
);
export const Payment = mongoose.model<IPaymentDoc>("Payment", PaymentSchema);
