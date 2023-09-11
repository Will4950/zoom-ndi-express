window.startLivestream = async (source, parentId) => {
	window.clappr = new window.Clappr.Player({
		source: source,
		parentId: `#${parentId}`,
		autoPlay: true,
		mute: true,
		width: 854,
		height: 480,
		events: {
			onError: function () {
				var s = window.clappr.options.source;
				var t = 10;
				var retry = function () {
					if (t === 0) {
						var o = window.clappr.options;
						o.source = s;
						window.clappr.configure(o);
						return;
					}
					window.Clappr.$('#retryCounter').text(t);
					t--;
					setTimeout(retry, 1000);
				};
				window.clappr.configure({
					autoPlay: true,
					source: 'playback.error',
					playbackNotSupportedMessage:
						'Stream is not streaming. Please try streaming something. <br><br>Checking for stream in <span id="retryCounter"></span> seconds... Reload to try sooner'
				});
				retry();
			}
		}
	});
	window.clappr.getPlugin('click_to_pause').disable();
};
