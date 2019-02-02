const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require('socket.io')(http);
const bodyParser = require("body-parser");


const port = 3010;

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



http.listen(port, () => {
  console.log(`Server running at ${port}`);
});

const SOCKET_LIST = {};

io.on('connection',socket => {
    console.log("someone connected")
    SOCKET_LIST[socket.id] = socket;
    socket.on('hello',data=>{
        console.log(data)
    })
    socket.on('icecandidate',data=>{
        console.log(data)
        socket.broadcast.emit('recieveIce',data)
    })
    socket.on('offer',data=>{
        console.log(data)
    //    socket.emit('goodbye','dipshit')
        socket.broadcast.emit('recieveOffer',data)
    })
    socket.on('answer',data=>{
        console.log(data)
        socket.broadcast.emit('recieveAnswer',data)
    })
})