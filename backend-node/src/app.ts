import express, {
	Response as ExResponse,
	Request as ExRequest,
	NextFunction,
} from "express";
import swaggerUi from "swagger-ui-express";
import bodyParser from "body-parser";
import { RegisterRoutes } from "../build/routes";
import mongoose from "mongoose";
import cors from "cors";
import { env, loadEnv } from "./env";
import { Problem, defaults } from "@emoyly/problem";
import jwtAuthMiddleware from "./middlewares/auth";
import * as Sentry from "@sentry/node";

import validateTsoa from "./middlewares/tsoaValidateProblem";

loadEnv();

async function init() {
	// lets initialize dotenv..

	//connect to mongoose
	await mongoose.connect(env.MONGO_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	Sentry.init({
		dsn:
			"https://7389b4020b464589a90c6b98090b3c35@o224625.ingest.sentry.io/5632070",

		// We recommend adjusting this value in production, or using tracesSampler
		// for finer control
		tracesSampleRate: 1.0,
	});

	// create the express app.
	const app = express();

	app.use(Sentry.Handlers.requestHandler());

	// set cors.
	app.use(
		cors({
			origin: env.BASE_URL,
			credentials: true,
		})
	);

	// enable bodyparser.
	app.use(
		bodyParser.urlencoded({
			limit: "250mb",
			extended: true,
		})
	);

	app.use(bodyParser.json({ limit: "250mb" }));

	// serve the documentation...
	app.use(
		"/docs",
		swaggerUi.serve,
		async (_req: ExRequest, res: ExResponse) => {
			return res.send(
				swaggerUi.generateHTML(await import("../build/swagger.json"))
			);
		}
	);

	app.use(jwtAuthMiddleware);

	// Register routes...
	RegisterRoutes(app);

	app.use(validateTsoa);
	app.use(Sentry.Handlers.errorHandler());

	function expressHandler(
		err: unknown,
		req: ExRequest,
		res: ExResponse,
		next: NextFunction
	): ExResponse | void {
		console.log(err);
		if (err instanceof Error && !(err instanceof Problem)) {
			// todo: handle logging of (Error)s
			err = new Problem(defaults.codes5xx["500"]);
		}

		if (err instanceof Problem) {
			return res.status(err.status).json(err.toObject());
		}

		next();
	}

	app.use(expressHandler);

	//
	console.log("listen..");
	app.listen(env.PORT);
}
init()
	.then(() => {
		console.log("loaded succes..");
	})
	.catch((err) => {
		console.error(err);
	});
