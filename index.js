const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const config = require("./config/config");
const mongodbURI = config.MONGOLAB_URI;
const mongojs = require("mongojs");
const db = mongojs(mongodbURI);
const account = db.collection("account");

const port = 3010;

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

http.listen(port, () => {
	console.log(`Server running at ${port}`);
});

const SOCKET_LIST = {};

io.on("connection", socket => {
	console.log("someone connected");
	SOCKET_LIST[socket.id] = { socket: socket };

	socket.on("login", data => {
		console.log(data);
		loginHandler(data, socket);
	});
	socket.on("icecandidate", data => {
		console.log(data);
		socket.to(SOCKET_LIST[socket.id].room).emit("recieveIce", data);
	});
	socket.on("offer", data => {
		console.log(data);
		//    socket.emit('goodbye','dipshit')
		socket.to(SOCKET_LIST[socket.id].room).emit("recieveOffer", data);
	});
	socket.on("answer", data => {
		console.log(data);
		socket.to(SOCKET_LIST[socket.id].room).emit("recieveAnswer", data);
	});
});

//TODO :::::::::  BETTER ENCRYPTIONS:::::::::: TODO
const loginHandler = (data, socket) => {
	if (!data.newAccount) {
		account.find({ username: data.username }, (err, docs) => {
			if (docs.length > 0) {
				//CHECKS PASSWORD
				if (docs[0].password == data.password) {
					//ADD USER TO ROOM SHARED BY SAME ACCOUNT/USER
					socket.join(data.username);
					SOCKET_LIST[socket.id].room = data.username;
					io.to(data.username).emit("hello", `hello ${data.username}`);
					socket.emit("login validation", [true]);
				} else {
					socket.emit("login validation", [
						false,
						"Wrong password or username."
					]);
				}
			} else {
				socket.emit("login validation", [false, "Wrong password or username."]);
			}
		});
	} else {
		account.find({ username: data.username }, (err, docs) => {
			if (docs[0]) {
				socket.emit("login validation", [false, "Username already taken."]);
			} else {
				////    sign up method
				console.log("sign up new account");
				////
			}
		});
	}
};
console.log(mongodbURI);
