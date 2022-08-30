//Global Variables
var profile = {username: "Alice"};

/*HELPER FUNCTIONS*/

// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
	while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
	let template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	return template.content.firstChild;
}

//Task 1
function main() {

  const socket = new WebSocket('ws://localhost:8000');
    socket.addEventListener('message', function (event) {
      var hello = JSON.parse(event.data)
      var roomsocket =  lobby.getRoom(hello['roomId']);
      roomsocket.addMessage(hello['username'], hello['text']);
    });
    
    window.removeEventListener('load',  main , false);
    window.addEventListener('popstate',  renderRoute , false);
    //Task 6
    var lobby = new Lobby();
    //Task 3
    var lobbyView = new LobbyView(lobby);
    var profileView = new ProfileView();
    var chatView = new ChatView(socket);
    //Task 2A
    function renderRoute(){
        var s = document.getElementById("page-view");
        var DOMCreated;
        var currentURL = window.location.hash;
        if (currentURL == "#/"){
            emptyDOM(s);
            DOMCreated = lobbyView.elem;
            s.appendChild(DOMCreated);
        }
        else if (currentURL.startsWith("#/chat/")){
            var roomId = currentURL.substring(7); // get the room id from the url hash
            var room1 = lobbyView.lobby.getRoom(roomId);
            if(room1!=null) {
                chatView.setRoom(room1);
              }
            emptyDOM(s);
            DOMCreated = chatView.elem;
            s.appendChild(DOMCreated);

        }
        else if (currentURL =="#/profile"){
            emptyDOM(s);
            DOMCreated = profileView.elem;
            s.appendChild(DOMCreated);
        }
        
    }
    //Assignment 3 Part 1
    function refreshLobby(){
      Service.getAllRooms().then(
        (result)=>{
          for (var i in result){
            if(typeof lobby.getRoom(result[i]._id) =="undefined"){
            lobby.addRoom(result[i]._id, result[i].name, result[i].image, result[i].messages);
            }
            else{
             //console.log(lobby.getRoom(result[i].id));
             lobby.rooms[result[i]._id].name = result[i].name;
             lobby.rooms[result[i]._id].image = result[i].image;
            }
       }
        },
        (error)=>{console.log(error);
        })
    }

    Service.getProfile().then((result) => {
      //console.log("THIS IS RESULT");
      console.log(result);
      profile.username = result["username"];
    });

    

    setInterval(refreshLobby, 5000);
    renderRoute();
    refreshLobby();
    //cpen400a.export(arguments.callee, { socket,refreshLobby, renderRoute, lobbyView, chatView, profileView,lobby });
  }

window.addEventListener('load',  main , false);

//Task 3
//Constructor for LobbyView
function LobbyView (lobby){
    this.elem = createDOM(`<div class="content">
    
    <ul class = "room-list">
      <li>
        <img src="/assets/everyone-icon.png" >
        <a href="#/chat/1">Everyone in CPEN400A</a>
      </li>
      <li>
        <img src="/assets/bibimbap.jpg" >
        <a href="#/chat/2">Foodies Only</a>
      </li>
      <li>
        <img src="/assets/minecraft.jpg">
        <a href="#/chat/3">Games Unite</a>
      </li>
      <li>
        <img src="assets/everyone-icon.png">
        <a href="#/chat/4">rmFour</a>
      </li>
      <li>
        <img src="assets/everyone-icon.png">
        <a href="#/chat/5">rmFive</a>
      </li>
    </ul>
    <div class = "page-control">
      <input type="text">
      <button type="button">
        <p>Create Room</p>
    </div>
  </div>`);
  var self = this;
  this.listElem = this.elem.querySelector("ul.room-list");
  //console.log(this.listElem);
  this.inputElem = this.elem.querySelector("input");
  this.buttonElem = this.elem.querySelector("button");
  this.lobby = lobby;
  this.lobby.onNewRoom = (function (room){
      var t = createDOM(`<li>
      <img src="${room.image}" >
      <a href="#/chat/${room.id}">${room.name}</a>
      </li>`);
      //console.log(t);
      self.listElem.appendChild(t);
  });
  this.redrawList();
  this.buttonElem.addEventListener('click',  function(){Service.addRoom({"name":self.inputElem.value}).then(
    (result)=>{
      lobby.addRoom(result["_id"],result["name"],result["image"],[] );
      self.inputElem.value = "";
    },
    (error)=>{console.log(error);
    })} , false);
}
LobbyView.prototype.redrawList = function redrawList(){
  emptyDOM(this.listElem);
  this.new_room = `<ul class = "room-list">`; //Beginning
  for(x in this.lobby.rooms){
      this.new_room = this.new_room.concat(`<li>
      <img src="${this.lobby.rooms[x].image}" >
      <a href="#/chat/${this.lobby.rooms[x].id}">${this.lobby.rooms[x].name}</a>
    </li>`);
  }
  this.end = this.new_room.concat(`</ul>`);
  var DOM_obj = createDOM(this.end);
  //console.log(DOM_obj);
  this.listElem.appendChild(DOM_obj);
}

//Constructor for ChatView 
function ChatView(socket){
    this.elem = createDOM(`<div class="content">
    <h4 class="room-name">
        <p>Everyone in CPEN400A</p>
    </h4>
    <div class = "message-list">
        <div class = "message">
            <span class ="message-user">
                <p>Friend</p>
            </span>
            <span class ="message-text">
                <p>Hey man I'm sorry you're not graduating this year...</p>
            </span>
        </div>
        <div class = "message my-message">
            <span class ="message-user">
                <p>Victor</p>
            </span>
            <span class ="message-text">
                <p>What do you mean? I'm graduating</p>
            </span> 
        </div>
        <div class = "message">
          <span class ="message-user">
              <p>Friend</p>
          </span>
          <span class ="message-text">
              <p>Nah you failed CPEN400A</p>
          </span>
      </div>
      <div class = "message my-message">
        <span class ="message-user">
            <p>Victor</p>
        </span>
        <span class ="message-text">
            <p>o ye crap</p>
        </span> 
    </div>
    </div>
    <div class = "page-control">
            <textarea></textarea>
            <button type="button">
              <p>Send</p>
          </div>
    </div>
    </div>`);
    var self = this;
    this.room = null;
    this.titleElem = this.elem.querySelector("h4.room-name");
    this.chatElem = this.elem.querySelector(".message-list");

    this.inputElem = this.elem.querySelector("textarea");
    this.buttonElem = this.elem.querySelector("button");
    this.socket = socket;
    //this.chatElem.style.minHeight = "50";
    //this.chatElem.style.maxHeight = "100";
    //this.chatElem.style.Height = "50%";
    //this.chatElem.style.overflowY = "scroll";

    this.buttonElem.addEventListener('click', function(){
      self.sendMessage();
    }, false );
    this.inputElem.addEventListener('keyup', function(event){
      if(event.key == 'Enter' && !event.shiftKey ){
        self.sendMessage();
      }
    }, false);

    this.chatElem.addEventListener('wheel', function(event){
      if(self.room.canLoadConversation == true && event.deltaY <0 && self.chatElem.scrollTop == 0 )
        self.room.getLastConversation.next();
    },false);

}

ChatView.prototype.sendMessage = function() {
  var y = this.inputElem.value;
  this.room.addMessage(profile.username,y);
  this.inputElem.value = null;
  //console.log("help")
  this.socket.send(JSON.stringify({
    "roomId": this.room.id,
		"username": profile.username,
		"text": y,
  }))
};

ChatView.prototype.setRoom =function setRoom(room){
  var that = this;
  this.room = room;
  this.titleElem.innerText = room.name;
  emptyDOM(this.chatElem);
  //this.msg =  `<div class = "message-list">`; //Beginning
  for(var x in this.room.messages){
    var msg = "";
    //console.log(this.room.messages[x].username);
    if(this.room.messages[x].username  == profile.username){
      //console.log(this.room.messages[x].username)
    msg =`<div class = "message my-message">
    <span class ="message-user">${(this.room.messages[x].username)}</span>
    <span class ="message-text">${(this.room.messages[x].text)}</span> 
</div>`;
    }
    else {
    msg = `<div class = "message">
            <span class ="message-user">${(this.room.messages[x].username)}</span>
            <span class ="message-text">${(this.room.messages[x].text)}</span>
        </div>`;
    }
  var DOM_obj_msg = createDOM(msg);
  this.chatElem.appendChild(DOM_obj_msg);
}
  
  this.room.onNewMessage = function (message){
    this.new_msg = "";
    var cleaned = message.text.replace(/</g, '&gt')
    cleaned = cleaned.replace(/>/g, '&lt');
    if(message.username == profile.username){
      //console.log(message.text);
      this.new_msg = createDOM(`<div class = "message my-message">
      <span class ="message-user">${(profile.username)}</span>
      <span class ="message-text">${(cleaned)}</span>
  </div>`);
    }
    else {
      //console.log(message.text)
      this.new_msg = createDOM(`<div class = "message">
      <span class ="message-user">${(message.username)}</span>
      <span class ="message-text">${(cleaned)}</span>
  </div>`);
    }
    //console.log(this.new_msg);
    that.chatElem.appendChild(this.new_msg);
  }
  this.room.onFetchConversation = function(conversation){
    var scrollheight_initial = that.chatElem.scrollHeight;
    var new_msg2 = "";
    //Reverse array
    conversation.messages.reverse();
    conversation.messages.forEach(element => {
      if(element.username == profile.username){
        new_msg2 = createDOM(`<div class = "message my-message">
        <span class ="message-user">${(profile.username)}</span>
        <span class ="message-text">${(element.text)}</span>
    </div>`);
      }
      else {
        new_msg2 = createDOM(`<div class = "message">
        <span class ="message-user">${(element.username)}</span>
        <span class ="message-text">${(element.text)}</span>
    </div>`);
      }
      //console.log(new_msg2);
      that.chatElem.insertBefore(new_msg2,that.chatElem.childNodes[0]);
      })
      conversation.messages.reverse();
      var scrollheight_final = that.chatElem.scrollHeight;
      that.chatElem.scrollTop = scrollheight_final - scrollheight_initial;
      //console.log(that.chatElem.scrollTop);
  }
}

//Constructor for ProfileView
function ProfileView(){
    this.elem = createDOM(`<div class="content">
    <div class="profile-form">
      <div class="form-field">
        <label>
          <p>Username</p>
          <input type="text">
        </div>
        <p></p>
        <div class="form-field">
          <label>
            <p>Password</p>
            <input type="password">
          </div>  
          <p></p>
          <div class="form-field">
            <label>
              <p>Avatar Image</p>
              <input type="file">
            </div>
      </div>
      <div class ="page-control">
        <button type="button">
          <p>Save</p>
      </div>
    </div>`);
}

//Task 5

function Room(id, name, image = 'assets/everyone-icon.png', messages = []){
    this.id = id;
    this.name = name;
    this.image = image;
    this.messages = messages;
    this.canLoadConversation = true;
    this.last_timestamp = Date.now();
    this.getLastConversation = makeConversationLoader(this);
    Room.prototype.addMessage = function (username, text){
      
        var cleaned = text.replace(/</g, '&gt');
        cleaned = cleaned.replace(/>/g, '&lt');
        if (cleaned == "" || !cleaned.trim().length){
            return 0;
        }
        else{
            var txt = {"username":username,
                       "text":cleaned};
            this.messages.push(txt);
        }
        if (typeof this.onNewMessage === 'function'){
            this.onNewMessage(txt);
          }
    }

    Room.prototype.addConversation= function(conversation){

    conversation.messages.forEach(element => {
    this.messages.push(element);
    })

    if (typeof this.onFetchConversation === 'function'){
      this.onFetchConversation(conversation);
    }
    }
}

function Lobby(){
    //this.rooms = { 1: rm1, 2: rm2, 3: rm3, 4: rm4, };
    this.rooms = {};
    var rm1 = new Room(1, "Everyone in CPEN400A", 'assets/everyone-icon.png', []);
    var rm2 = new Room(2, "Foodies only", 'assets/everyone-icon.png', []);
    var rm3 = new Room(3, "Gamers unite", 'assets/everyone-icon.png', []);
    var rm4 = new Room(4, "rmFour", 'assets/everyone-icon.png', []);
    var rm5 = new Room(5, "rmFive", 'assets/everyone-icon.png', []);
    //this.rooms = { 1: rm1, 2: rm2, 3: rm3, 4: rm4, 5:rm5 };
    Lobby.prototype.getRoom = function getRoom(roomId){
        for(x in this.rooms){
            if(x == roomId){
                return this.rooms[x];
            }
        }
        //return;
    }
    Lobby.prototype.addRoom = function addRoom(id, name, image, messages){
        var room = new Room(id, name, image, messages);
        this.rooms[id] = room;
        if (typeof this.onNewRoom === "function"){
        this.onNewRoom(room);
        }
      }
}

//Assignment 3

var Service = {
  origin: window.location.origin,
  getAllRooms: function(){
  return new Promise((resolve,reject)=>{
    var xhr =  new XMLHttpRequest();
    //xhr.responseType = "json";
    xhr.onload = function(){
      if(xhr.status == 200 ){
        resolve(JSON.parse(xhr.responseText));
      }
      else{
        reject(new Error((xhr.responseText)));
      }
      }
    xhr.onerror = function(){
        reject(new Error(xhr.responseText));
      }
    xhr.open("GET", Service.origin + "/chat");
    xhr.send();
  });
},
  addRoom: function(data){
    return new Promise((resolve,reject)=>{
    var xhr = new XMLHttpRequest();
    xhr.onload = function(){
      if(xhr.status == 200 ){
        resolve(JSON.parse(xhr.responseText));
      }
      else{
        reject(new Error((xhr.responseText)));
      }
      }
    xhr.onerror = function(){
        reject(new Error(xhr.responseText));
      }
    xhr.open("POST", Service.origin + "/chat");
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(JSON.stringify({"name":data.name, "image":data.image}));
    });
  },

  getLastConversation: function(roomId, before){
    return new Promise((resolve,reject)=>{
      var xhr =  new XMLHttpRequest();
      //xhr.responseType = "json";
      xhr.onload = function(){
        if(xhr.status == 200 ){
          resolve(JSON.parse(xhr.responseText));
        }
        else{
          reject(new Error((xhr.responseText)));
        }
        }
      xhr.onerror = function(){
          reject(new Error(xhr.responseText));
        }
      xhr.open("GET", `/chat/${roomId}/messages?before=${before}`);
      xhr.send();
    });
  },

  getProfile: function(){
    return new Promise((resolve,reject)=>{
      var xhr =  new XMLHttpRequest();
      //xhr.responseType = "json";
      xhr.onload = function(){
        if(xhr.status == 200 ){
          resolve(JSON.parse(xhr.responseText));
        }
        else{
          reject(new Error((xhr.responseText)));
        }
        }
      xhr.onerror = function(){
          reject(new Error(xhr.responseText));
        }
      xhr.open("GET", Service.origin + "/profile");
      xhr.send();
    });
  }
  }

  function * makeConversationLoader(room){
    let first = room.last_timestamp;
    while (room.canLoadConversation){
      yield new Promise((resolve) => {
      room.canLoadConversation = false;
      Service.getLastConversation(room.id, first).then((result) => {
        if(result!=null){
          room.canLoadConversation = true;
          room.addConversation(result);
          first = result.timestamp;
          resolve(result);
        }
        else{
          resolve(null);
        }
      });
      });
    }
  }
  

