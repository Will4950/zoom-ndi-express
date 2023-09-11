import {config} from './config.js';
import {logger} from './logger.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import OBSWebSocket from 'obs-websocket-js';
const obs = new OBSWebSocket();

export function checkLab(check) {
	let lab = null;
	for (let i in config.labs) {
		if (check === config.labs[i].lab) lab = config.labs[i];
	}
	return lab;
}

export function genSignature(meetingNumber, host) {
	try {
		let iat = Math.round((new Date().getTime() - 30000) / 1000);
		let exp = iat + 60 * 60 * 2;
		let signature = jwt.sign(
			{
				appKey: config.zoom.sdk_key,
				sdkKey: config.zoom.sdk_key,
				mn: meetingNumber,
				role: host,
				iat: iat,
				exp: exp,
				tokenExp: iat + 60 * 60 * 2
			},
			config.zoom.sdk_secret
		);
		return signature;
	} catch (e) {
		logger.warn(`sig | ${e}`);
	}
}

export function randstr(prefix) {
	return Math.random()
		.toString(36)
		.replace('0.', prefix || '');
}

export async function sab(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
	);
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, PATCH, OPTIONS'
	);
	res.header('Cross-Origin-Embedder-Policy', 'require-corp');
	res.header('Cross-Origin-Opener-Policy', 'same-origin');
	if (req.method === 'OPTIONS') {
		res.sendStatus(200);
		res.end();
		return;
	}
	next();
}

export async function getAccessToken() {
	try {
		let oauthToken = Buffer.from(
			`${config.zoom.clientid}:${config.zoom.clientsecret}`
		).toString('base64');

		let res = await axios({
			method: 'post',
			url: '/token',
			baseURL: 'https://zoom.us/oauth',
			headers: {Authorization: `Basic ${oauthToken}`},
			params: {
				grant_type: 'account_credentials',
				account_id: config.zoom.accountid
			}
		});
		return res.data.access_token;
	} catch (e) {
		logger.warn(`Error getting S2S access token | ${e.message}`);
		return false;
	}
}

export async function connectZoomRoomPMI(roomid) {
	let access_token = await getAccessToken();
	if (access_token === false) return;
	try {
		await axios({
			method: 'patch',
			url: `/rooms/${roomid}/events`,
			baseURL: 'https://api.zoom.us/v2',
			headers: {
				Authorization: `Bearer ${access_token}`,
				'Content-Type': 'application/json'
			},
			data: {method: 'zoomroom.meeting_join', params: {}}
		});
		return true;
	} catch (e) {
		logger.warn(`Error connecting zoom room to pmi | ${e.message}`);
		return false;
	}
}

export async function switchCamera(ip, camera) {
	try {
		await obs.connect(`ws://${ip}:4455`);
		for (let i = 1; i <= config.labs.length + 1; i++) {
			await obs.call('SetSceneItemEnabled', {
				sceneName: 'Cameras',
				sceneItemId: i,
				sceneItemEnabled: false
			});
		}
		await obs.call('SetSceneItemEnabled', {
			sceneName: 'Cameras',
			sceneItemId: camera,
			sceneItemEnabled: true
		});
		await obs.disconnect();
	} catch (e) {
		logger.warn(e.message);
	}
}

export async function getActiveCamera(ip) {
	try {
		await obs.connect(`ws://${ip}:4455`);
		let {sceneItems} = await obs.call('GetSceneItemList', {
			sceneName: 'Cameras'
		});
		await obs.disconnect();
		for (let camera in sceneItems) {
			if (sceneItems[camera].sceneItemEnabled === true)
				return sceneItems[camera].sceneItemId;
		}
	} catch (e) {
		logger.warn(e.message);
	}
	return 1;
}
