export const config = new Object();

config['labs'] = [
	{
		name: 'Lab 001 - ISS',
		num: 1,
		cams: [1, 2, 3, 4],
		lab: 'ISS',
		roomid: process.env.LAB001_roomid,
		room: process.env.LAB001_room,
		meetingNumber: process.env.LAB001_meetingNumber,
		password: process.env.LAB001_password
	},
	{
		name: 'Lab 002 - Moon',
		num: 5,
		cams: [5, 6, 7, 8],
		lab: 'Moon',
		roomid: process.env.LAB002_roomid,
		room: process.env.LAB002_room,
		meetingNumber: process.env.LAB002_meetingNumber,
		password: process.env.LAB002_password
	},
	{
		name: 'Lab 003 - Mars',
		num: 9,
		cams: [9, 10, 11, 12],
		lab: 'Mars',
		roomid: process.env.LAB003_roomid,
		room: process.env.LAB003_room,
		meetingNumber: process.env.LAB003_meetingNumber,
		password: process.env.LAB003_password
	}
];

function isProd() {
	return process.env.NODE_ENV === 'production' ? true : false;
}

config['isProd'] = isProd();
config['debug'] = process.env.DEBUG === 'true' ? true : false;
config['host'] =
	process.env.HOST === 'localhost' ? '0.0.0.0' : process.env.HOST || '0.0.0.0';
config['domain'] = process.env.DOMAIN || 'https://localhost';
config['port'] = isProd() ? process.env.PORT : process.env.PORT || '3000';
config['stream'] = process.env.BASE_URL;

config['zoom'] = new Object();
config['zoom']['sdk_key'] = process.env.ZOOM_SDK_CLIENTID;
config['zoom']['sdk_secret'] = process.env.ZOOM_SDK_CLIENTSECRET;
config['zoom']['accountid'] = process.env.ZOOM_S2S_ACCOUNTID;
config['zoom']['clientid'] = process.env.ZOOM_S2S_CLIENTID;
config['zoom']['clientsecret'] = process.env.ZOOM_S2S_CLIENTSECRET;
