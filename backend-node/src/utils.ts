import { randomBytes } from "crypto";
import mongoose, { isValidObjectId } from "mongoose";
//import concat from 'concat-stream'
//import {Base64Encode} from 'base64-stream'

export const generateToken = (size: number): Promise<string> => {
	return new Promise((resolve) =>
		randomBytes(size, (err, buffer) => resolve(buffer.toString("hex")))
	);
};

export const streamToBase64 = (stream: any): Promise<string> => {
	/*return new Promise((resolve, reject) => {
	  const base64 = new Base64Encode()
  
	  const cbConcat = (base64: any) => {
		resolve(base64)
	  }
  
	  stream
		.pipe(base64)
		.pipe(concat(cbConcat))
		.on('error', (error: any) => {
		  reject(error)
		})
	})*/

	return new Promise((resolve, reject) => {
		let buffers: any = [];
		let myStream = stream;
		myStream.on("data", (chunk: any) => {
			buffers.push(chunk);
		});
		myStream.once("end", () => {
			let buffer = Buffer.concat(buffers);
			resolve(buffer.toString("base64"));
		});
		myStream.once("error", (err: any) => {
			reject(err);
		});
	});
};

export function isRefArrayPopulated<T>(obj: Array<any>): obj is Array<T> {
	return !obj.some((x) => x instanceof mongoose.Types.ObjectId);
}

export function isRefPopulated<T>(obj: any): obj is T {
	return !(obj instanceof mongoose.Types.ObjectId);
}
