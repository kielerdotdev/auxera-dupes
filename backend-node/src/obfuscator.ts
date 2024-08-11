import proc from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { generateToken } from "./utils";
import {Problem} from '@emoyly/problem'

// @ts-ignore
import { crc32 } from "crc";
const tokenizerPath = "/app/obfuscator/tokenizer";
const obfuscatorPath = "/app/obfuscator/obfuscator";
const dataPath = "/app/e2data";

async function tokenize(fileIn: string, fileOut: string) {
	return new Promise((resolve, reject) => {
		const ls = proc.spawn("lua", ["run.lua", fileIn, fileOut], {
			cwd: tokenizerPath,
		});

		ls.stdout.on("data", (data: any) => {
			//			reject(data)
		});

		ls.stderr.on("data", (data: any) => {
			console.error(data.toString())

			reject(new Problem({
				type: "/obfuscator/tokenize",
				status: 500,
				title: "tokenize server error.",
				detail: `The E2 failed our tokenizer.`,
			}))
		});

		ls.on("close", (code: any) => {
			if (code != 0) {
				reject(new Problem({
					type: "/obfuscator/tokenizecode",
					status: 500,
					title: "tokenize server error.",
					detail: `The E2 failed our tokenizer, code ${code}.`,
				}))
				return;
			}

			resolve(fileOut);
		});
	});
}

async function obfuscate(fileIn: string, fileOut: string) {
	return new Promise((resolve, reject) => {
		const ls = proc.spawn("node", ["index.js", fileIn, fileOut], {
			cwd: obfuscatorPath,
		});

		ls.stderr.on("data", (data) => {
			console.error(data.toString())
			reject(new Problem({
				type: "/obfuscator/obfuscate",
				status: 500,
				title: "obfuscate server error.",
				detail: "The E2 passed our tokenizer, but failed obfuscating.",
			}));
		});

		ls.on("close", (code) => {
			if (code != 0) {
				reject(new Problem({
					type: "/obfuscator/obfuscate/invalidreturncode",
					status: 500,
					title: "obfuscate server error.",
					detail: "The E2 passed our tokenizer, but failed obfuscating. (INVALID RETURN CODE)",
				}));
				return;
			}

			resolve(fileOut);
		});
	});
}

interface IObfuscatedE2 {
	code: string;
	token: string;
}
export async function handle(e2code: string): Promise<IObfuscatedE2> {
	console.log("handling e2 obfuscation...")
	console.log(e2code)

	// lets write a temp file.
	const e2token = await generateToken(16);

	const inPath = path.join(dataPath, "in", e2token);
	const tokenPath = path.join(dataPath, "tokens", e2token);
	const outPath = path.join(dataPath, "out", e2token);

	await fs.writeFile(inPath, e2code, "utf8");
	console.log("wrote file yay")

	await tokenize(inPath, tokenPath);
	console.log("token man")
	
	await obfuscate(tokenPath, outPath);
	console.log("obfu man")

	const file = await fs.readFile(outPath, "utf8");
	console.log("read man")

	return {
		code: file,
		token: e2token,
	};
}

export async function getHash(e2code: string): Promise<string> {
	// remove white spaces
	e2code = e2code.replace(/ +/gm, " ") + "\n";
	const hash = crc32(e2code);

	return hash;
}
