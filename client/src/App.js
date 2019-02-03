import React, { Component } from "react";
import io from "socket.io-client";
import Chat from "./Chat";

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			username: "",
			password: "",
			isNewAccount: false,
			message: "",
			isLoggedIn: false,
			socket: io("http://localhost:3010"),
			spiderStyle: "rotate(180deg)"
		};

		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.spiderFollow = this.spiderFollow.bind(this);
	}
	componentDidMount() {
		let socket = this.state.socket;
		socket.on("login validation", data => {
			data[0]
				? this.setState({ isLoggedIn: true })
				: this.setState({ message: data[1] });
		});
		socket.on("hello", data => console.log(data));
	}
	handleChange(e) {
		let target = e.target;
		if ("username" === target.name) {
			this.setState({ [target.name]: target.value });
		} else if ("password" === target.name) {
			this.setState({ [target.name]: target.value });
		} else if ("isNewAccount" === target.name) {
			this.setState({ [target.name]: target.checked });
		}
	}
	handleSubmit(e) {
		e.preventDefault();
		console.log(this.state);
		if (this.state.isNewAccount && this.state.password.length < 8) {
			this.setState({
				message: "Password needs to be at least 8 characters."
			});
		} else {
			let payload = {
				username: this.state.username,
				password: this.state.password,
				newAccount: this.state.isNewAccount
			};
			this.state.socket.emit("login", payload);
		}
	}
	spiderFollow(e) {
		let spider = document.getElementById("spider-login");
		let spiderPos = spider.getBoundingClientRect();
		let spiderX = spiderPos.x + spiderPos.width / 2;
		let spiderY = spiderPos.y + spiderPos.height / 2;
		let angle = Math.atan2(e.clientY - spiderY, e.clientX - spiderX);
		angle = (angle * 180) / Math.PI;
		angle += 90;
		if (angle < 0) {
			angle += 360;
		}
		this.setState({ spiderStyle: `rotate(${angle}deg)` });
	}
	render() {
		return (
			<div className="App">
				{this.state.isLoggedIn ? (
					<Chat socket={this.state.socket} />
				) : (
					<div
						className="d-flex justify-content-center align-items-center"
						style={{ height: 100 + "vh" }}
						onMouseMove={this.spiderFollow}
					>
						<form
							onSubmit={this.handleSubmit}
							onChange={this.handleChange}
							style={{ width: 250 + "px" }}
						>
							{" "}
							<div>
								<img
									id="spider-login"
									src="assets/spiderLayer.png"
									alt="Logo"
									style={{
										width: 250 + "px",
										transform: this.state.spiderStyle
									}}
								/>
							</div>
							<div className="form-group">
								<label htmlFor="inputUsername">Username</label>
								<input
									name="username"
									type="text"
									className="form-control"
									id="inputUsername"
									placeholder="Enter username"
								/>
							</div>
							<div className="form-group">
								<label htmlFor="inputPassword">Password</label>
								<input
									name="password"
									type="password"
									className="form-control"
									id="inputPassword"
									placeholder="Enter password"
								/>
							</div>
							<div className="form-check">
								<input
									name="isNewAccount"
									type="checkbox"
									className="form-check-input"
									id="checkNewAccount"
									defaultChecked={this.state.isNewAccount}
								/>
								<label className="form-check-label" htmlFor="checkNewAccount">
									New User
								</label>
							</div>
							<button type="submit" value="Submit" className="btn btn-primary">
								Submit
							</button>
							<div style={{ fontSize: 12 + "px", height: 15 + "px" }}>
								{this.state.message}
							</div>
						</form>
					</div>
				)}
			</div>
		);
	}
}

export default App;
