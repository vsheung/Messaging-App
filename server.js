// assuming cpen400a-tester.js is in the same directory as server.js
//const cpen400a = require('./cpen400a-tester.js');
const cpen400a = require('server');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const express = require('express');

//ASSIGNMENT 4
var mongoUrl = "mongodb://localhost:27017";
var dbName = "cpen400a-messenger";
var Database = require("./Database.js");
var db = new Database(mongoUrl, dbName);

//ASSIGNMENT 5
var SessionManager = require("./SessionManager.js");
var sessionManager = new SessionManager();
const crypto = require('crypto');

function isCorrectPassword(password, saltedHash){
	var salt = saltedHash.substring(0, 20);
    var input_password = crypto.createHash('sha256').update(password + salt).digest('base64');
    return (input_password == saltedHash.substring(20));
}

var chatrooms = [{id:"id1", name:"name1", image:'assets/everyone-icon.png'},{id:"id2", name:"name2", image:'assets/everyone-icon.png'}];
var messageBlockSize = 10;
var messages = {};
//chatrooms.forEach(element => {
//	messages[element.id] = [];
//})

//function getMessages() {
	db.getRooms().then((result) => {
		result.forEach(element => {
		messages[element._id] = [];
		})
	//console.log(messages);
   });
  //}
  //getMessages();
  //console.log(messages);


const broker = new WebSocket.Server({ port: 8000 });
broker.on('connection', (ws,request) =>{
	//console.log(request.headers);
	if(request.headers.cookie == null || sessionManager.getUsername(request.headers.cookie.substring(17))==null )
		ws.close();
	ws.on('message', (data) => {
			broker.clients.forEach(client => {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					var msg_parsed = JSON.parse(data);
					msg_parsed["username"] = sessionManager.getUsername(request.headers.cookie.substring(17));
					msg_parsed["text"] = msg_parsed["text"].replace(/</g, '&gt;').replace(/>/g, '&lt;'); //SANITIZE
					if (msg_parsed["text"].search('&gt') == -1 && msg_parsed["text"].search('&lt') == -1){
						var json_msg = JSON.stringify(msg_parsed);
						client.send(json_msg);
					}
					else{
						var json_msg_ATTACKED = JSON.stringify(msg_parsed);
						msg_parsed["text"] = "";
						client.send(json_msg_ATTACKED);
					}
				}
			});
			var parse_msg = JSON.parse(data);
			var newmsg = {
				"username": sessionManager.getUsername(request.headers.cookie.substring(17)),
				"text": parse_msg.text.replace(/</g, '&gt;').replace(/>/g, '&lt;') //SANITIZE
			};
			if (newmsg["text"].search('&amp') == -1 && newmsg["text"].search('&lt') == -1 )
				messages[parse_msg.roomId].push(newmsg);

			//Assignment 4 additions
			if (messages[parse_msg.roomId].length == messageBlockSize && newmsg["text"].search('&lt') == -1 && newmsg["text"].search('&lt') == -1){
				db.addConversation(
					{
						//"_id": ObjectId(String),
						"room_id": parse_msg.roomId,
						"timestamp": Date.now(),
						"messages": messages[parse_msg.roomId]
					}
				);
				messages[parse_msg.roomId] = []; //Empty array
			}
		});
});
function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express apps
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/chat/:room_id/messages', sessionManager.middleware);
app.use('/chat/:room_id', sessionManager.middleware);
app.use('/chat', sessionManager.middleware);
app.use('/profile', sessionManager.middleware);

app.use('/app.js', sessionManager.middleware, express.static(clientApp + '/app.js'));
app.use('/index.html', sessionManager.middleware, express.static(clientApp + '/index.html'));
app.use('/index', sessionManager.middleware, express.static(clientApp + '/index.html'));

app.use(/^\/$/,sessionManager.middleware, express.static(clientApp, { extensions: ['html'] }));
app.use('/', express.static(clientApp, { extensions: ['html'] }));


app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

//Assignment 5
app.post('/login', function (req,res){
	db.getUser(req.body.username).then((result) =>{
		if (result == null){
			res.redirect('/login');
		}
		else{
			if(isCorrectPassword(req.body.password, result.password)){
				sessionManager.createSession(res, req.body.username);
				res.redirect('/');
			}
			else
			res.redirect('/login');
		}
	});
})

app.get('/logout',function (req, res) {
	sessionManager.deleteSession(req);
	res.redirect('/login');
  })

app.get('/profile',function (req, res) {
	//console.log(req);
	res.send(JSON.stringify({"username":req.username}));
  })

app.get('/chat/:room_id/messages',function (req, res) {
	//console.log("QUERY VALUE");

	db.getLastConversation(req.params.room_id, req.query.before).then((result) => {
		if(result!=null){
			res.send(JSON.stringify(result));
			//console.log('API');
			//console.log(result);
		}
		else{
			res.status(404).send("Error Message");
		}

	});
  })


app.get('/chat/:room_id',function (req, res) {
	console.log(req.params.room_id);
	db.getRoom(req.params.room_id).then((result) => {
		if(result!=null){
			//console.log("OBJECT RECEIVED");
			res.send(JSON.stringify(result));
		}
		else{
			res.status(404).send(`Room ${req.params.room_id} was not found`);
		}

	},(error)=> console.log(error));
  })


app.route('/chat')
  .all(function (req, res, next) {
    next();
  })
  .get(function (req, res) {
	var returnarr = []; //Array of objects
	db.getRooms().then((result) => {
		result.forEach(element1 => {
		returnarr.push({
			"_id": element1._id,
			"name": element1.name,
			"image": element1.image,
			"messages": messages[element1._id]
		});
	});
	res.json(returnarr)
	//res.send(JSON.stringify(returnarr));
	
	}) 
  })

  .post(function (req, res, next) {
	  var parse = req.body;
	  //console.log(parse);
    if(!("name"in req.body)){
		res.status(400).send('Bad request');
	}
	else{
		var newarr = {
			"_id": req.body['name'],
			"name": req.body['name'],
			"image": req.body['image'],
		}
		//console.log("OBJECT POSTED");
		//console.log(newarr);
		db.addRoom(newarr).then((result) => {
		//messages[newarr['_id']] = [];
		messages[result['_id']] = [];
		//console.log("THIS IS RESULT");
		//console.log(result);
		res.status(200).send(JSON.stringify(result));
		},(error)=> console.log(error))
	}
  })

//Custom error handling
app.use(function errorhandling(err,req,res,next){
	if (err instanceof SessionManager.Error){
		if(req.get('Accept') == 'application/json'){
			res.status(401).send(JSON.stringify(err));
		}
		else{
			res.redirect('/login');
		}
	}
	else if (err){
		res.status(500).send("ERROR");
	}
	else
		next();
})

// at the very end of server.js
//cpen400a.connect('http://35.183.65.155/cpen400a/test-a5-server.js');
//cpen400a.export(__filename, { app,chatrooms,messages,broker,db, messageBlockSize, sessionManager, isCorrectPassword});