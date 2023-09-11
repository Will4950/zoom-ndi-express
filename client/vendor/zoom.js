const zoomclient = window.ZoomMtgEmbedded.createClient();

window.startZoom = (data) => {
	zoomclient.checkSystemRequirements();
	const zoomAppRoot = window.$('#meetingSDK').get(0);

	zoomclient
		.init({
			debug: true,
			assetPath: window.location.origin + '/lib/av',
			zoomAppRoot: zoomAppRoot,
			language: 'en-US',
			customize: {
				video: {
					isResizable: false,
					popper: {
						disableDraggable: true,
						anchorElement: zoomAppRoot
					},
					viewSizes: {
						default: {
							width: 830,
							height: 470
						}
					},
					defaultViewType: 'speaker'
				},
				toolbar: {
					buttons: [
						{
							text: "Don't click this button!",
							className: 'CustomButton',
							onClick: () => {
								window.$('#errortitle').text('Ouch!');
								window
									.$('#errortext')
									.text('Thank you for clicking the button.');
								window.$('#modal_error').modal('show');
							}
						}
					]
				}
			}
		})
		.then(() => joinMeeting(data))
		.catch((e) => console.log(e));
};

const joinMeeting = (data) => {
	zoomclient
		.join(data)
		.then(() => {
			checkMeetingStatus();
			setInterval(() => {
				checkMeetingStatus();
			}, 8000);
		})
		.catch((e) => {
			console.log(e);
			setTimeout(() => endMeeting(), 8000);
		});
};

function endMeeting() {
	zoomclient.endMeeting().catch((e) => {
		console.log(e);
	});
	zoomclient.leaveMeeting().catch((e) => {
		console.log(e);
	});
}

function checkMeetingStatus() {
	const MeetingInfo = zoomclient.getCurrentMeetingInfo();
	if (!MeetingInfo.isInMeeting && MeetingInfo.participantId === 0) endMeeting();
}
