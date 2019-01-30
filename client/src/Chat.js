import React, { Component } from "react";

class Chat extends Component {
	constructor(props) {
		super(props);
		this.state = {
			stream: null,
			configuration: {
				iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
				localPeerConnection: null,
				remotePeerConnection: null,
				myVid: null,
				remoteVid: null
			}
		};
		this.toggleSelf = this.toggleSelf.bind(this);
		this.callOther = this.callOther.bind(this);
		this.receiveCall = this.receiveCall.bind(this);
		this.getAnswer = this.getAnswer.bind(this);
		this.getIce = this.getIce.bind(this);
		//	this.handleRemotePeer = this.handleRemotePeer.bind(this);
	}

	componentDidMount() {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices
				.getUserMedia({ video: true, audio: false })
				.then(stream => {
					this.setState({ stream: stream });

					this.toggleSelf();

					console.log(this.state)


				});
		}
	}
	toggleSelf() {
		// console.log(this.state.stream);
		// console.log(this.state.stream.getTracks());
		// const ownVid = document.getElementById("vid1");
		// if (ownVid.srcObject) {
		// 	ownVid.srcObject = null;
		// } else {
		// 	ownVid.srcObject = this.state.stream;
		// 	ownVid.play();
		// }
		const ownVid = document.getElementById("vid1");
		const remoteVid = document.getElementById("vid2");
		this.setState({ myVid: ownVid, remoteVid: remoteVid });
	}

	callOther() {
		console.log(this.state.stream);
		const localPeerConnection = new RTCPeerConnection(this.state.configuration);
		this.state.stream.getTracks().forEach(track => {
			localPeerConnection.addTrack(track, this.state.stream);
		});
		localPeerConnection
			.createOffer({
				offerToReceiveVideo: 1
			})
			.then(offer => {
				localPeerConnection.setLocalDescription(offer);
				localPeerConnection.ontrack = event => {
					console.log(event);
					console.log("RECIEVING VIDEO");
				};
				localPeerConnection.onnegotiationneeded = event => {
					console.log("need negociatioe");
				};
				this.setState({ localPeerConnection: localPeerConnection });
				this.state.localPeerConnection.ontrack = event => {
					console.log("GOT TRACK");
				};
				this.state.localPeerConnection.onicecandidate = event => {
					if (event.candidate) {
						let data = {
							type: "iceCandidate",
							payload: event.candidate
						};
						fetch("/icecandidate", {
							method: "POST",
							mode: "cors",
							headers: {
								"Content-Type": "application/json"
							},
							body: JSON.stringify(data)
						});
					}
				};
				this.state.localPeerConnection.oniceconnectionstatechange = event => {
					if (event.currentTarget.iceConnectionState == "completed") {
						console.log("we are connected!");
						let test = this.state.localPeerConnection.getReceivers();
						console.log(test);
						//		let test2 = this.state.localDescription.getTracks();
						//		console.log(test2)
					}
				};
				this.state.localPeerConnection.ontrack = event => {
					console.log(event, "GOT VIDEA");
				};
				return;
			})
			.then(() => {
				this.sendToServer(localPeerConnection);
			});
	}
	sendToServer(localPeerConnection) {
		fetch("/connect", {
			method: "POST",
			mode: "cors",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(localPeerConnection.localDescription)
		}).then(res => res.json().then(res => console.log(res)));
	}

	receiveCall() {
		fetch("/connect").then(res => {
			res.json().then(res => this.handleRemotePeer(res.data));
		});
	}

	handleRemotePeer(res) {
		const remotePeerConnection = new RTCPeerConnection(
			this.state.configuration
		);
		remotePeerConnection.setRemoteDescription(res).then(() => {
			this.state.stream.getTracks().forEach(track => {
				remotePeerConnection.addTrack(track, this.state.stream);
			});
		});
		remotePeerConnection
			.createAnswer({
				offerToReceiveVideo: 1
			})
			.then(answer => {
				remotePeerConnection.setLocalDescription(answer);
				this.setState({ remotePeerConnection: remotePeerConnection });
				remotePeerConnection.onnegotiationneeded = event => {
					console.log("need nego");
				};
				return;
			})
			.then(() => {
				this.sendAnswerToServer(remotePeerConnection);
			});
	}
	sendAnswerToServer(remotePeerConnection) {
		fetch("/sendAnswer", {
			method: "POST",
			mode: "cors",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(remotePeerConnection.localDescription)
		}).then(res => res.json().then(res => console.log(res)));
	}

	getAnswer() {
		fetch("/sendAnswer").then(res => {
			res.json().then(res => {
				console.log(res.data);
				let sdp = res.data;
				this.state.localPeerConnection.setRemoteDescription(sdp).then();
				console.log("end???");
			});
		});
	}

	getIce() {
		fetch("/icecandidate").then(res =>
			res.json().then(res => {
				res.data.forEach(val => {
					console.log(val.payload);
					this.state.remotePeerConnection.addIceCandidate(val.payload);
					this.state.remotePeerConnection.ontrack = event => {
						console.log(event, "GOT VIDEA");
					};
				});
				this.state.remotePeerConnection.oniceconnectionstatechange = event => {
					if (event.currentTarget.iceConnectionState == "completed") {
						console.log("we are connected!");
						let test = this.state.remotePeerConnection.getReceivers();
						console.log(test);
						//		let test2 = this.state.localDescription.getTracks();
						//		console.log(test2)
					}
				};
				let test = this.state.remotePeerConnection.getReceivers();
				let mediastream = new MediaStream();
					mediastream.addTrack(test[0].track)
				this.state.remoteVid.srcObject = mediastream;
				this.state.remoteVid.play();
				console.log(test);
			})
		);
	}
	render() {
		return (
			<div className="Chat">
				<video id="vid1" style={{ width: 300, height: 300 }} />
				Video chat
				<video id="vid2" style={{ width: 300, height: 300 }} />
				Video chat 2
				<div>
					<button id="startButton" onClick={this.toggleSelf}>
						Show /Hide self
					</button>
					<button id="callButton" onClick={this.callOther}>
						Call other
					</button>
					<button id="callButton" onClick={this.receiveCall}>
						Receive Call
					</button>
					<button id="hangupButton" onClick={this.getAnswer}>
						Get Answer
					</button>
					<button id="hangupButton" onClick={this.getIce}>
						Get ICE
					</button>
				</div>
			</div>
		);
	}
}

export default Chat;
