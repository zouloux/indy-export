import readline from "node:readline";
import { join, dirname } from "node:path";
import { existsSync, readFileSync, writeFileSync, createWriteStream, mkdirSync } from "node:fs";
import * as https from "node:https";

const dataDir = join(process.cwd(), 'data');

// ----------------------------------------------------------------------------- ASK CLI QUESTION

const rl = readline.promises.createInterface({
	input: process.stdin,
	output: process.stdout
});

export async function askQuestion ( question:string ) {
	return await rl.question(`${question}`);
}

// ----------------------------------------------------------------------------- ENVS

export function loadEnvs ( filePath:string = ".env" ) {
	if ( !existsSync(filePath) )
		return false
	const envFile = readFileSync(filePath, 'utf-8');
	const lines = envFile.split('\n');
	const envs:any = {}
	lines.forEach(line => {
		const [key, value] = line.split('=');
		if ( key && value ) {
			const k = key.trim()
			const v = value.trim()
			envs[k] = v
			process.env[k] = v
		}
	});
	return envs
}

// ----------------------------------------------------------------------------- FETCH

export async function createFetch ( url:string, bearer:string ) {
	try {
		const r = await fetch(url, {
			method: "GET",
			referrerPolicy: "no-referrer",
			headers: {
				"authorization": `Bearer ${bearer}`,
				"cache-control": "no-cache",
				"pragma": "no-cache",
			},
		});
		const d = await r.json()
		if ( typeof d === "object" && typeof d.error === "string" ) {
			console.log(`API Error: ${url}`)
			console.error(d)
			process.exit(1)
		}
		return d
	}
	catch (e) {
		console.log(`HTTP Error: ${url}`)
		console.error(e)
		process.exit(1)
	}
}

// ----------------------------------------------------------------------------- ENSURE DIR

export function ensureDirectoryExists(filePath: string) {
	const directory = dirname(filePath);
	if (!existsSync(directory)) {
		mkdirSync(directory, { recursive: true });
	}
}

// ----------------------------------------------------------------------------- WRITE DATA

export function writeDataFile ( filePath:string, data:any ) {
	const outputPath = join(dataDir, filePath);
	ensureDirectoryExists(outputPath);
	writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

// ----------------------------------------------------------------------------- TASK

export async function task ( title:string, task:() => Promise<any> ) {
	process.stdout.write(title)
	let r
	try {
		r = await task()
	}
	catch (e) {
		console.error(e)
		process.exit(1)
	}
	console.log(" - Done")
	return r
}

// ----------------------------------------------------------------------------- COMPUTE PERCENTAGE

export function computePercentage(value: number, total: number): string {
  if (total === 0) return "0.0%";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

// ----------------------------------------------------------------------------- DOWNLOAD

export async function downloadFile (url:string, filePath:string) {
  return new Promise((resolve, reject) => {
		const outputPath = join(dataDir, filePath);
    ensureDirectoryExists(outputPath);
    https.get(url, (response) => {
			const fileStream = createWriteStream(outputPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve('Download completed.');
      });
    }).on('error', (error) => {
      reject(`Error downloading the file: ${error.message}`);
    });
  });
}
