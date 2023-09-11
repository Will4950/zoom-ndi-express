import {config} from './config.js';
import {logger} from './logger.js';
import {
	checkLab,
	connectZoomRoomPMI,
	genSignature,
	randstr,
	getActiveCamera,
	switchCamera
} from './utils.js';
import pug from 'pug';
import {Server} from 'socket.io';

export const io = new Server({
	serveClient: false,
	pingInterval: 3500
});

function socketsHandler(socket) {
	socket.on('command', async (data, response) => {
		let lab = checkLab(data.location.split('/')[2]);
		if (lab === null) throw new Error('Lab not found');

		let toast = randstr('toast_');
		data.toast = toast;
		data.html = pug.renderFile('./client/views/renders/toast.pug', {
			lab: lab.lab,
			cam: data.feed,
			dir: data.display,
			toast
		});

		if (data.action === 'cameraSwitch') {
			switchCamera(lab.room, data.feed);
			io.emit('changeCamera', {
				code: 201,
				active: data.feed,
				location: data.location
			});
		}

		response({code: 200, ...data});
		if (data.action === 'feedSwitch') return;
		if (data.location.split('/')[1] === 'rtmp') return;
		io.emit('commandResponse', {code: 200, ...data});
	});

	socket.on('startMeetingSDK', async (data, response) => {
		try {
			let lab = checkLab(data.location.split('/')[2]);
			if (lab === null) throw new Error('Lab not found');

			let res = new Object();
			res.sdkKey = config.zoom.sdk_key;
			res.signature = genSignature(lab.meetingNumber, 1);
			res.meetingNumber = lab.meetingNumber;
			res.password = lab.password;
			res.userName = 'Remote Viewer';
			res.code = 200;
			res.active = await getActiveCamera(lab.room);
			res.location = data.location;

			await connectZoomRoomPMI(lab.roomid);
			socket.emit('changeCamera', res);
			response(res);
		} catch (e) {
			logger.warn(`startMeetingSDK | ${e.message}`);
			response({code: 500});
		}
	});
}

io.on('connection', socketsHandler);
