import axios from "axios";
import { env } from "./env";

//const delay = 10200

const engine = axios.create({
	baseURL: "https://stavox.dk/tablet/apps/appstore/api/",
	headers: {
		Authorization: env.STAVOX_API_KEY,
	},
});

let lastMessage = 0;
// Add a request interceptor
engine.interceptors.request.use(async (config: any) => {
	const now = Date.now();
	const delay = 10500; //config?.delay

	const timeSinceLastMessage = now - lastMessage;

	if (delay > timeSinceLastMessage) {
		const timeout = delay - timeSinceLastMessage;
		await new Promise((resolve) => setTimeout(resolve, timeout));
	}

	lastMessage = Date.now();

	// Do something before request is sent
	return config;
});

// Add a response interceptor
engine.interceptors.response.use(function (response) {
	if (response?.data?.success != true) {
		throw response.data;
	}

	return response;
});

export const giveMoney = async (steamid: string, amount: number) => {
	const params = new URLSearchParams();
	params.append("steamid", steamid);
	params.append("amount", amount.toString());

	await engine.post("givemoney", params);
};
