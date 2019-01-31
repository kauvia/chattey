const express = require("express");
const app = express();
const http = require("http").Server(app);
const bodyParser = require("body-parser");


const hostname = "127.0.0.1";
const port = 3010;

let connectionInfo;

let answer;

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



http.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const connectUsers=(req,res)=>{
    connectionInfo = req.body;
    console.log(req.body)
    res.send({success:true})
}

const sendInfo=(req,res)=>{
    console.log(connectionInfo)
   res.send({data:connectionInfo})
}
const recieveAnswer=(req,res)=>{
    console.log(req.body);
    answer=req.body;
    res.send({success:true})
}
const returnAnswer=(req,res)=>{
    console.log(answer)
    res.send({data:answer})
}


let icecandy = [];
const recieveIce = (req,res)=>{
    console.log(req.body);
    icecandy.push(req.body);

    res.send({success:true})
}

const sendIce = (req,res)=>{
    console.log(icecandy)
    res.send({data:icecandy})
}



app.post("/connect",connectUsers);
app.get("/connect",sendInfo);
app.post("/sendAnswer",recieveAnswer)
app.get("/sendAnswer", returnAnswer)
app.post("/icecandidate",recieveIce)
app.get("/icecandidate",sendIce)