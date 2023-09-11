import {config} from './config.js';
import {logger} from './logger.js';
import {checkLab, sab} from './utils.js';
import express from 'express';

export const router = express.Router();

function setLocals(req, res, next) {
	let lab = checkLab(req.params.lab);

	if (lab === null) {
		logger.warn(`lab not found: ${req.params.lab}`);
		res.redirect('/');
		return;
	}

	res.locals.lab = lab.name || 'Lab';
	res.locals.num = lab.num || 0;
	res.locals.cams = lab.cams || [0];
	res.locals.stream = config.stream || 'http://localhost';
	res.locals.state = lab.lab || 'Lab';

	next();
}

function oauth(req, res) {
	res.status(200).json({
		code: 200,
		state: 'manual add',
		message: 'Authorization successful.  You may now close this browser tab.'
	});
}

router.get('/', (req, res) => res.render('index'));
router.get('/rtmp/:lab', setLocals, (req, res) => res.render('rtmp'));
router.get('/msdk/:lab', setLocals, sab, (req, res) => res.render('msdk'));
router.get('/oauth/zoom', oauth);
