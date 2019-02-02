import React, { Component } from "react";
import io from "socket.io-client";
const socket = io("http://localhost:3010");

const PEERS = [];
const ICE = [];

class Chat extends Component {
	constructor(props) {
		super(props);
		this.state = {
			apiURL: "",
			stream: null,
			configuration: {
				iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
			},
			remoteStreams: []
		};
		this.viewCam = this.viewCam.bind(this);
		this.playVideo = this.playVideo.bind(this);
	}

	componentDidMount() {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices
				.getUserMedia({ video: true, audio: false })
				.then(stream => {
					this.setState({ stream: stream });
				});
		}
		socket.on("recieveOffer", data => {
			console.log("recieved offer");
			this.setupCam(data);
		});
		socket.on("recieveIce", data => {
			console.log("recieved ice");
			ICE.push(data);
			this.setIce();
		});
		socket.on("recieveAnswer", data => {
			console.log("recieved answer");
			this.setAnswer(data);
		});
	}
	setupCam(data) {
		const pc = new RTCPeerConnection(this.state.configuration);
		this.state.stream.getTracks().forEach(track => {
			pc.addTrack(track, this.state.stream);
		});
		let config = { offerToRecieveVideo: 1 };
		pc.setRemoteDescription(data).then(() => {
			pc.createAnswer(config).then(answer => {
				pc.setLocalDescription(answer).then(() => {
					PEERS.push(pc);
					this.signal("answer", pc.localDescription);
					pc.onicecandidate = e => {
						if (e.candidate) {
							this.signal("icecandidate", e.candidate);
						}
					};
				});
			});
		});
	}
	setAnswer(data) {
		let pc = PEERS[0];
		pc.setRemoteDescription(data);

		let tracks = pc.getReceivers();
		let mediastream = new MediaStream();
		tracks.forEach(obj => mediastream.addTrack(obj.track));
		this.setState({
			remoteStreams: [...this.state.remoteStreams, mediastream]
		});
		console.log(this.state);
	}
	setIce() {
		let pc = PEERS[0];
		if (pc) {
			ICE.forEach(val => {
				pc.addIceCandidate(val);
			});
		} else {
			setTimeout(this.setIce, 1000);
		}
	}
	viewCam() {
		const pc = new RTCPeerConnection(this.state.configuration);
		let config = { offerToRecieveVideo: 1 };
		this.state.stream.getTracks().forEach(track => {
			pc.addTrack(track, this.state.stream);
		});
		pc.createOffer(config).then(offer => {
			pc.setLocalDescription(offer).then(val => {
				PEERS.push(pc);
				this.signal("offer", pc.localDescription);
				pc.onicecandidate = e => {
					if (e.candidate) {
						this.signal("icecandidate", e.candidate);
					}
				};
			});
		});
	}

	signal(header, payload) {
		socket.emit(header, payload);
	}

	playVideo() {
		this.state.remoteStreams.forEach((val,idx)=>{
			let video = document.getElementById(`video${idx}`)
			video.srcObject = val;
			video.play()
		})
	}

	render() {
		return (
			<div className="Chat">
				{this.state.remoteStreams.map((val,idx)=>{

					return <div key={'stream'+idx}><video id={'video'+idx} style={{width:300,height:300}}  onClick={this.playVideo}/></div>
				})
				}
				<div>
					<button id="callButton" onClick={this.viewCam}>
						View Cam
					</button>
				</div>
			</div>
		);
	}
}

export default Chat;
