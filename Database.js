const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen400a app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
			db.collection("chatrooms").find().toArray(function(err,result){
				if (err){
					reject(new Error(err));
				}
				else{
					resolve(result);
					//console.log(result);
				}
			 });

		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
			//If it is objectID, read as objectID first
			if(ObjectID.isValid(room_id)){
			db.collection("chatrooms").find({"_id":ObjectID(room_id)}).toArray(function(err,result){
				if (err){
					resolve(null);
				}
				else if(result.length == 0){
					resolve(null);
				}
				else if (String(result[0]._id) == room_id){
					console.log("OBJECT RECEIVED")
					console.log(result[0]);
					resolve(result[0]);
				}
				else{ //This is for the string
					db.collection("chatrooms").find({"_id":room_id}).toArray(function(err2,result2){
						if (err2){
							resolve(null);
						}

						else if(result2.length == 0){
							resolve(null);
						}
						else if (String(result2[0]._id) == room_id){
							//If there is a match, resolve
							console.log("OBJECT RECEIVED")
							console.log(result2[0]);
							resolve(result2[0]);
						}
						else{
							console.log('ERROR 2')
							resolve(null);
						}
					});
				}
			});
			}
			else{ //its a string type
				db.collection("chatrooms").find({"_id":room_id}).toArray(function(err,result){
					//console.log(room_id);
					if (err){
						resolve(null);
					}
					else if(result.length == 0){
						resolve(null);
					}
					else if (String(result[0]._id) == room_id){
						//If there is a match, resolve
						console.log("OBJECT RECEIVED")
						console.log(result[0]);
						resolve(result[0]);
					}
					else{
						resolve(null);
					}
				});
			}



		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
			//if(room._id == null){
				if(room.name == null || typeof room.name == 'undefined')
					reject(new Error("There was an error here 2"));
				else{
				console.log(room);
				db.collection("chatrooms").insertOne({"name":room.name, "image": room.image}, function(err,result) {
					console.log(result);
				if (err)
					throw err;
				else{
					var obj = {"_id":result.ops[0]._id,
					"name": room.name,
					"image": room.image}
					console.log("OBJECT ADDED")
					console.log(obj);
					resolve(obj);
				}
			  }); 
			}
			//}
			/*
			else{
				db.collection("chatrooms").insert({_id: room._id,name: room.name, image: room.image}, function(err, result) {
					console.log("ADD ROOM DEBUGGING2");
					console.log(result);
					if (err ){
						console.log("There was an error here HELLO");
						resolve(null);
					}
					else if(room.name == null)
						reject(new Error("There was an error here 2"));
					else{
						//console.log(result.ops[0]);
						resolve("HELLO");
					}
				  }); 

			}
			*/
			
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
			var given_before = before;
			if (given_before == null){
				given_before = Date.now();
			}
		

			db.collection("conversations").find({"room_id":room_id}).toArray(function(err, result) {
				//console.log(result);
				if (err){
					reject(new Error(err));
				}
				else if (result.length == 0){
					resolve(null);
				}
				else if (result.length==1){
						if(result[0].timestamp<given_before)
							resolve(result[0]);
						else
							resolve(null);
				}
				else{
					var returnobj = null;
					var closest_time = Number.MAX_SAFE_INTEGER;
					result.forEach(element1 => {
						if(element1.timestamp<given_before&&Math.abs(element1.timestamp-given_before)<closest_time && element1.messages !=null){
							returnobj = element1;
							closest_time = element1.timestamp;
						}
					});
					resolve(returnobj);
				}
		
			}); 

		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			
			 db.collection("conversations").insertOne(conversation, function(err, result) {
				//console.log(result[0]);
				if (err ){
					reject(new Error(err));
				}
					else if(conversation.room_id == null||conversation.timestamp == null||conversation.messages == null)
					reject(new Error("There was an error here 2"));
				else{
					resolve(result.ops[0]);
				}
			  }); 
			  
		})
	)
}

Database.prototype.getUser = function(username){
	return this.connected.then(db =>
		new Promise((resolve,reject) => {
			db.collection("users").find({"username":username}).toArray(function(err,result){
				if (err){
					resolve(null);
				}
				else{
					resolve(result[0]);
				}
			 });
		})
	)
}
module.exports = Database;