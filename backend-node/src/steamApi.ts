import axios from "axios";
import { env } from "./env";

interface ISteamUserData {
	steamid: string;
	communityvisibilitystate: number;
	profilestate: number;
	personaname: string;
	commentpermission: number;
	profileurl: string;
	avatar: string;
	avatarmedium: string;
	avatarfull: string;
	avatarhash: string;
	personastate: number;
	realname: string;
	primaryclanid: string;
	timecreated: number;
	personastateflags: number;
}
export async function getUser(steamId64: string): Promise<ISteamUserData> {
	try {
		const { data } = await axios.get(
			`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env.STEAM_API_KEY}&steamids=${steamId64}`
		);
		const { players } = data.response;

		if (!players || players.length != 1) {
			throw "invalid steam user(s) found...";
		}

		return players[0];
	} catch (err) {
		throw "steam_get_user";
	}
}
