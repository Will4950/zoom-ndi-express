import 'dotenv/config';
import {config} from './src/config.js';
import {app} from './src/express.js';
import {logger} from './src/logger.js';
import {io} from './src/socketio.js';
import {createServer} from 'node:http';

function onHup(signal) {
	logger.info(`EVENT RECEIVED: ${signal}`);
}

function onInt() {
	process.exit();
}

process.on('SIGHUP', onHup);
process.on('SIGINT', onInt);

async function onListening() {
	logger.info(`http | listening on ${config.host}:${config.port}`);
	io.attach(server);
	logger.info(`socket.io | attached`);
}

async function onError(error) {
	logger.error(`http | ${error}`);
	process.exit(1);
}

const server = createServer(app);
server.on('error', onError);
server.on('listening', onListening);

server.listen(config.port, config.host);
