import express, { response } from 'express';
import chalk from 'chalk';
import { Faction } from './types';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import csv from 'csv-parser';
import { log } from 'console';

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const env = app.get('env').trim();


const rawData = []
// const winData = []
const filepath = './src/csv-import/armies.csv';

async function readCsv(path: string) {
	const data = new Promise((resolve, reject) => {
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
  
function sortData(array) {
	let winData = {}
	rawData.forEach((row) => {
		const key = row['Faction/String'].toLowerCase().replaceAll(' ', '_') // Converting to all lower case for faction ID's
		const gamesPlayed = Number(row['Battles/TotalWins']) + Number(row['Battles/TotalLosses']) + Number(row['Battles/TotalDraws'])
		if(winData[key]) {
			winData[key].wins = winData[key].wins + Number(row['Battles/TotalWins']) 
			winData[key].losses = winData[key].losses + Number(row['Battles/TotalLosses'])
			winData[key].draws = winData[key].draws + Number(row['Battles/TotalDraws'])
			winData[key].gamesPlayed = winData[key].gamesPlayed + gamesPlayed
			winData[key].playerCount++
		}
		else {
			winData[key] = {
				name: row['Faction/String'],
				wins: Number(row['Battles/TotalWins']),
				losses: Number(row['Battles/TotalLosses']),
				draws: Number(row['Battles/TotalDraws']),
				playerCount: 1,
				gamesPlayed: gamesPlayed
			}
		}
	})
	const factions = Object.keys(winData)
	factions.forEach((fac) => {
		const winperc = Math.floor(winData[fac]['gamesPlayed'] === 0 ? 0 : winData[fac]['wins'] / winData[fac]['gamesPlayed'] * 100) //rounds down
		winData[fac]['winRate'] = `${winperc}%`
	})
	return winData
}


const data = await readCsv(filepath);
const sorted = sortData(data);


// app.get('/hello', async (req, res: express.Response<string>) => {
// 	res.json('Hello world');
// });

app.get('/faction/:id', async (req, res: express.Response<Faction | { message:string }>) => {
	const factionId = req.params.id
	if (sorted[factionId]) {
		res.status(200).json({
			name: sorted[factionId].name,
			wins: sorted[factionId].wins,
			losses: sorted[factionId].losses,
			draws: sorted[factionId].draws,
			playerCount: sorted[factionId].playerCount,
			gamesPlayed: sorted[factionId].gamesPlayed,
			winRate: sorted[factionId].winRate
		});
	}
	else {
		res.status(404).json({
			message: `Faction ${req.params.id} does not exist`
		});
	}
});


// app.get('/faction/:id', async (req, res: express.Response<any | { message:string }>) => {
// 	if(req.params.id === '1') {
// 		res.status(200).json({
// 			name: sorted.Necrons,
// 			wins: 4,
// 			numOfPlayers: 3,
// 			gamesPlayed: 3
// 		});
// 	}
// 	else {
// 		res.status(404).json({
// 			message: `Faction #${req.params.id} does not exist`
// 		});
// 	}
// });

app.listen(8080, () => {
	if(env === 'development') {
		console.log(chalk.magenta('-----------------------------------------------------------------------'));
		console.log(chalk.magenta(`Server running at http://localhost:8080. Environment is "${env}."`));
		console.log(chalk.magenta('-----------------------------------------------------------------------'));
	}
});

