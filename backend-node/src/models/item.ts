import mongoose from "mongoose";
import { IUserDoc } from "./user";

const versionMatcher = /^\d+(\.\d+)*$/;

const ItemTypes = ["e2", "dupe"];
export type ItemType = "e2" | "dupe";

export interface ItemJson {
	author: {
		name: string;
		steamId: string;
	};
	type: ItemType;
	title: string;
	price: number;
	description: string;
	images: string[];
	tags: string[];
	disabled?: {
		name: string;
		steamId: string;
		roles: string[];
	};
}

export interface IItem {
	author: mongoose.Types.ObjectId | IUserDoc;
	disabled?: {
		user: mongoose.Types.ObjectId | IUserDoc;
		type: "normal" | "forced";
	};
	type: ItemType;
	title: string;
	price: number;
	description: string;
	images: string[];
	tags?: string[];
	versions: {
		authHash?: string;
		authData?: string;
		createdAt?: Date;
		data: string;
		version: string;
		disabled?: boolean;
	}[];
}

export interface IItemDoc extends IItem, mongoose.Document {}
export interface IItemModel extends mongoose.Model<IItemDoc> {}

const ItemSchemaFields: Record<keyof IItem, any> = {
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	disabled: {
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		type: {
			type: String,
		},
	},
	type: {
		type: String,
		required: true,
		enum: ItemTypes,
	},
	title: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		min: 5000,
		max: 10000000,
		required: true,
		validate: {
			validator: Number.isInteger,
			message: "{VALUE} is not an integer value",
		},
	},
	description: {
		type: String,
		required: true,
	},
	images: {
		type: [String],
		required: true,
	},
	tags: {
		type: [String],
	},
	versions: {
		type: [
			{
				authHash: String,
				authData: String,
				createdAt: {
					type: Date,
					default: Date.now,
				},
				data: {
					type: String,
					required: true,
				},
				version: {
					type: String,
					required: true,
					match: versionMatcher,
					maxLength: 20,
				},
				disabled: {
					type: Boolean,
					default: false,
				},
			},
		],
		default: [],
	},
};

export const ItemSchema = new mongoose.Schema<IItemDoc, IItemModel>(
	ItemSchemaFields
);

export const Item = mongoose.model<IItemDoc>("Item", ItemSchema);
