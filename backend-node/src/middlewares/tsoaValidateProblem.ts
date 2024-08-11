import express, {
	Response as ExResponse,
	Request as ExRequest,
	NextFunction,
} from "express";
import { ValidateError } from "tsoa";
import { Problem, defaults } from "@emoyly/problem";

export default function middleware(
	err: unknown,
	req: ExRequest,
	res: ExResponse,
	next: NextFunction
): ExResponse | void {
	if (err instanceof ValidateError) {
		var detail = "No detail provided";
		if (err.fields) {
			detail = Object.values(err.fields)
				.map((field) => field.message)
				.join(" | ");
		}
		console.log(err);
		next(
			new Problem({
				type: "/validateerror",
				title: "Validation failed",
				detail: detail,
				status: 422,
			})
		);
	}

	next(err);
}
