import express from 'express';
import chalk from 'chalk';
import { Faction } from './types';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const env = app.get('env').trim();

app.get('/hello', async (req, res: express.Response<string>) => {
	res.json('Hello world');
});

app.get('/faction/:id', async (req, res: express.Response<Faction | { message:string }>) => {
	if(req.params.id === '1') {
		res.status(200).json({
			name: 'My almighty faction',
			wins: 4,
			numOfPlayers: 3,
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
