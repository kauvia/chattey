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
const ROOM_LIST = {};

io.on("connection", socket => {
	console.log("someone connected");
	SOCKET_LIST[socket.id] = { socket: socket };

	socket.on("login", data => {
//		console.log(data);
		loginHandler(data, socket);
	});
	socket.on("view mode", data => {
        ROOM_LIST[SOCKET_LIST[socket.id].room][socket.id].viewMode = data;
	});
	socket.on("icecandidate", data => {
	//	console.log(data);

		socket.to(SOCKET_LIST[socket.id].room).emit("recieveIce", data);
	});
	socket.on("offer", data => {
		for (let obj in ROOM_LIST[SOCKET_LIST[socket.id].room]) {
			if(!ROOM_LIST[SOCKET_LIST[socket.id].room][obj].viewMode){
                io.to(`${obj}`).emit("recieveOffer",data)  
            }
		}
	});
	socket.on("answer", data => {
		for (let obj in ROOM_LIST[SOCKET_LIST[socket.id].room]) {
			if(ROOM_LIST[SOCKET_LIST[socket.id].room][obj].viewMode){
                io.to(`${obj}`).emit("recieveAnswer",data)  
            }
		}
	//	socket.to(SOCKET_LIST[socket.id].room).emit("recieveAnswer", data);
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
					if (ROOM_LIST[data.username]) {
						ROOM_LIST[data.username][socket.id] = {
							socket: socket,
							viewMode: false
						};
					} else {
						ROOM_LIST[data.username] = {};

						ROOM_LIST[data.username][socket.id] = {
							socket: socket,
							viewMode: false
						};
					}
           //         console.log(ROOM_LIST)

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
