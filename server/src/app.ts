import express, { response } from 'express';
import chalk from 'chalk';
import { Faction } from './types';
import * as fs from 'fs';
import csv from 'csv-parser';

const app = express();
const PORT = process.env.PORT || 8080

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const env = app.get('env').trim();


const rawData = []
const filepath = './src/csv-import/armies.csv';

async function readCsv(path: string): Promise<{ [key: string]: string }[]> {
	const data: Promise<{ [key: string]: string }[]> = new Promise((resolve, reject) => {
		fs.createReadStream(path)
			.pipe(csv())
			.on('data', (row) => {
				rawData.push(row);
			})
			.on('end', () => {
				console.log('Done.');
				resolve(rawData);
			})
			.on('error', reject)
	})

	return data;
}

function processData(array): { [key: string]: Faction } {
	let processedData = {}
	rawData.forEach((row) => {
		const key = row['Faction/String'].toLowerCase().replaceAll(' ', '_') // Converting to all lower case for faction ID's
		const gamesPlayed = Number(row['Battles/TotalWins']) + Number(row['Battles/TotalLosses']) + Number(row['Battles/TotalDraws'])
		if (processedData[key]) {
			processedData[key].wins = processedData[key].wins + Number(row['Battles/TotalWins'])
			processedData[key].losses = processedData[key].losses + Number(row['Battles/TotalLosses'])
			processedData[key].draws = processedData[key].draws + Number(row['Battles/TotalDraws'])
			processedData[key].gamesPlayed = processedData[key].gamesPlayed + gamesPlayed
			processedData[key].playerCount++
		}
		else {
			processedData[key] = {
				name: row['Faction/String'],
				wins: Number(row['Battles/TotalWins']),
				losses: Number(row['Battles/TotalLosses']),
				draws: Number(row['Battles/TotalDraws']),
				playerCount: 1,
				gamesPlayed: gamesPlayed
			}
		}
	})
	const factions = Object.keys(processedData)
	factions.forEach((fac) => {
		const winperc = Math.floor(processedData[fac]['gamesPlayed'] === 0 ? 0 : processedData[fac]['wins'] / processedData[fac]['gamesPlayed'] * 100)
		processedData[fac]['winRate'] = Number(winperc)
	})

	return processedData
}


//Gets the imported data and processes it.
const data = await readCsv(filepath);
const processedData: { [key: string]: Faction } = processData(data);



// API Endpoints

// Individual Factions
app.get('/faction/:id', async (req, res: express.Response<Faction | { message: string }>) => {
	const factionId = req.params.id
	const result = Object.values(processedData).find(item => item.name.toLowerCase().replaceAll(' ', '_') === factionId)
	if (result) {
		res.status(200).json({
			...result,
			winRate: `${result.winRate}%`
		});
	}
	else {
		res.status(404).json({
			message: `Faction ${req.params.id} does not exist`
		});
	}
});

// Full meta
app.get('/gufmeta', async (req, res: express.Response<any | { message: string }>) => {
	//Sort by win rate
	// Converts processed data to array and sorts in decending order
	let processedArray = Object.entries(processedData).sort((a, b) => {
		if (a[1].winRate < b[1].winRate) {
			return 1;
		}
		return -1;
	})
	processedArray.forEach(faction => faction[1].winRate = `${faction[1].winRate}%`)
	// Converts back to object to return
	const sortedObject = Object.fromEntries(processedArray);

	if (sortedObject) {
		res.status(200).json(sortedObject);
	}
	else {
		res.status(404).json({
			message: 'An error occurred.'
		})
	}
});


// Starts app
app.listen(PORT, () => {
	if (env === 'development') {
		console.log(chalk.magenta('-----------------------------------------------------------------------'));
		console.log(chalk.magenta(`Server running at http://localhost:${PORT}. Environment is "${env}."`));
		console.log(chalk.magenta('-----------------------------------------------------------------------'));
	}
});

