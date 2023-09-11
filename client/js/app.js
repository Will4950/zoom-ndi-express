window.LOCATION = location.pathname;
console.log(window.LOCATION);

window.socket = window.io({
	transports: ['websocket'],
	reconnectionAttempts: 600,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 3000,
	timeout: 20000
});

window.socket.on('disconnect', (reason) => {
	if (reason === 'io server disconnect') {
		window.location.reload();
	}
});

window.socket.io.on('reconnect_failed', () => {
	window.location.reload();
});

window.socket.io.on('reconnect', () => {
	window.location.reload();
});

window.socket.io.on('reconnect_attempt', (attempt) => {
	if (attempt >= 2) {
		window.$('#modal_connecting').modal('show');
	}
});

window.addEventListener('pageshow', function (event) {
	var historyTraversal =
		event.persisted ||
		(typeof window.performance != 'undefined' &&
			window.performance.navigation.type === 2);
	if (historyTraversal) {
		window.location.reload();
	}
});

window.showError = (title, text) => {
	window.$('#errortitle').text(title);
	window.$('#errortext').html(text);
	window.$('#modal_error').modal('show');
};

window.FEED = 1;
window.sendCommand = (command) => {
	command.location = window.LOCATION;
	window.socket.emit('command', command, window.handleCommand);
};

window.socket.on('commandResponse', (data) => window.handleCommand(data));

window.handleCommand = (data) => {
	if (!!data.html === true) {
		if (window.LOCATION === data.location)
			window.$('#toasts').append(data.html);
	}
	if (!!data.source === true) {
		window.clappr.configure({source: data.source});
	}
};

window.sendPress = (command) => {
	command.feed = window.FEED;
	window.sendCommand(command);
};

window.updateFeed = (feed) => {
	for (let i = 1; i <= 4; i++) {
		window.$(`#camera${i}`).addClass('btn-outline-button');
		window.$(`#camera${i}`).removeClass('btn-button');
	}
	window.$(`#camera${feed}`).addClass('btn-button');
	window.$(`#camera${feed}`).removeClass('btn-outline-button');
};

window.changeFeed = (source, feed, display) => {
	window.FEED = feed;
	window.sendCommand({action: 'feedSwitch', feed, source, display});
	window.updateFeed(feed);
};

window.changeCamera = (feed, display) => {
	window.FEED = feed;
	window.sendCommand({action: 'cameraSwitch', feed, display});
	window.updateFeed(feed);
};

window.handleMeetingSDKEvent = (data) => {
	if (data.code === 500) return; //error
	window.startZoom(data);
};

window.socket.on('changeCamera', (data) => {
	if (data.location === window.LOCATION) {
		window.FEED = data.active;
		window.updateFeed(data.active);
	}
});

window.$(() => {
	if (window.LOCATION.split('/')[1] === 'rtmp') window.updateFeed(1);
});
