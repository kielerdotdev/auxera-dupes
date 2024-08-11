import mongoose from "mongoose";

export interface IAuthLog {
	steamid: string;
	hash: string;
	createdAt: Date;
}

export interface IAuthLogDoc extends IAuthLog, mongoose.Document {}
export interface IAuthLogModel extends mongoose.Model<IAuthLogDoc> {}

const AuthLogSchemaFields: Record<keyof IAuthLog, any> = {
	steamid: String,
	hash: {
		type: String,
		required: false
	},
	createdAt: {
		type: Date,
		default: Date.now,
	}
};

export const AuthLogSchema = new mongoose.Schema<IAuthLogDoc, IAuthLogModel>(
	AuthLogSchemaFields
);

export const AuthLog = mongoose.model<IAuthLogDoc>(
	"AuthLog",
	AuthLogSchema
);
