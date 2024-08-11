import { RelyingParty } from "openid";

let party: RelyingParty;
export let url: string | undefined;
export async function init(returnUrl: string, realm: string) {
	party = new RelyingParty(returnUrl, null, true, false, []);

	console.log(realm, returnUrl);

	// get the url
	url = await new Promise((resolve, reject) => {
		party.authenticate(
			"https://steamcommunity.com/openid",
			false,
			(error, authUrl) => {
				if (error) return reject("ID failed: " + error);
				if (!authUrl) return reject("ID failed. invalid authUrl");

				resolve(authUrl);
			}
		);
	});
}

export async function verify(url: string): Promise<string> {
	const status = await new Promise<string>((resolve, reject) => {
		//console.log(url)
		party.verifyAssertion(url, (error, result) => {
			if (error !== null) {
				return reject("verify_error");
			}

			if (!result || result.claimedIdentifier == null) {
				return reject("verify_error_invalid_identifier");
			}

			const communityid = result.claimedIdentifier.replace(
				"https://steamcommunity.com/openid/id/",
				""
			);

			if (!communityid) {
				return reject("invalid_communityid");
			}

			resolve(communityid);
		});
	});

	return status;
}
