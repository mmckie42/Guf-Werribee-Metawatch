import express from 'express';
import chalk from 'chalk';
import { Faction } from './types';
import { parse } from 'csv-parse';
import * as fs from 'fs';

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const env = app.get('env').trim();

// Import data from csv section
// using info from https://sebhastian.com/read-csv-javascript/
// this will probably need to be its own section.
const winData = []
fs.createReadStream('./src/csv-import/armies.csv')
	.pipe(parse({ delimiter: ",", columns: true, ltrim: true }))
	.on("data", function (row) {
		// console.log(row)
		winData.push(row)
	})
	.on("error", function (error) {
		console.log(error.message);
	})
	.on("end", function () {
		console.log(winData);
		console.log("finished");
	});


// End import data section
// the data is now imported and stored as winData.
// Next step is to compile each faction into its own faction object with the combined data from winData

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

