import { EnvType, load } from "ts-dotenv";

export type Env = EnvType<typeof schema>;

export const schema = {
	MONGO_URL: String,
	PORT: { type: Number, default: 8080 },
	BASE_URL: String,
	API_KEY: String,
	STEAM_API_KEY: String,
	STAVOX_API_KEY: String,
	NODE_ENV: String
};

export let env: Env;


export function loadEnv(): void {
	console.log("loading env...");

	env = load(schema);
	console.log(env);
}
