import express, { response } from 'express';
import chalk from 'chalk';
import { Faction } from './types';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import csv from 'csv-parser';

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const env = app.get('env').trim();


const rawData = []
const winData = []
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
	let winData = {
		// imperium: {},
		// orks: {}
	}
	rawData.forEach((row) => {
		if(winData['Faction/String']) {
			winData['Faction/String'].wins = 0; //replace 0 with new value
		}
		else {
			winData['Faction/String'] = {
				name: row['Faction/String'],
				wins: 0,
				gamesPlayed: Number(row['Battles/TotalWins']) + Number(row['Battles/TotalLosses']) + Number(row['Battles/TotalDraws'])
			}
		}
	})
	return winData
}

const data = await readCsv(filepath);
const sorted = sortData(data);
console.log('sorted', sorted);




app.get('/hello', async (req, res: express.Response<string>) => {
	res.json('Hello world');
});

app.get('/faction/:id', async (req, res: express.Response<Faction | { message:string }>) => {
	if(req.params.id === 'adMech') {
		res.status(200).json({
			name: 'Adeptus Mechanicus',
			wins: 4,
			numOfPlayers: 3,
			gamesPlayed: 3
		});
	}
	else {
		res.status(404).json({
			message: `Faction #${req.params.id} does not exist`
		});
	}
});

app.listen(8080, () => {
	if(env === 'development') {
		console.log(chalk.magenta('-----------------------------------------------------------------------'));
		console.log(chalk.magenta(`Server running at http://localhost:8080. Environment is "${env}."`));
		console.log(chalk.magenta('-----------------------------------------------------------------------'));
	}
});

