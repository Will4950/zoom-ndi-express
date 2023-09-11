import {config} from './config.js';
import {logger} from './logger.js';
import express from 'express';
export const router = express.Router();

router.use((err, req, res, next) => {
	if (err) {
		const message = {
			status: 500,
			code: 'ERR_500',
			message: config.isProd ? 'Something bad happened.' : err.message
		};
		res.status(500).json(message);
		logger.error(message);
	} else {
		next();
	}
});

router.use((req, res) => {
	const message = {status: 404, code: 'ERR_404', message: '404 not found.'};
	res.status(404).json(message);
	logger.error(message);
});
