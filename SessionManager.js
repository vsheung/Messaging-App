const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {'test':{"username":"test", "password":""}};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        const buf = crypto.randomBytes(20).toString("hex"); //Generate token
        //var username = username;
        sessions[buf] = {"username":username};
        console.log(sessions);
        response.cookie('cpen400a-session', buf,{maxAge: maxAge});
        setTimeout(function(){
            delete sessions[buf];
        },maxAge);
	};

	this.deleteSession = (request) => {
        console.log(request);
        delete sessions[request["session"]];
        delete request["username"];
        delete request["session"]
	};

	this.middleware = (request, response, next) => {
        if (request.headers.cookie == null){
            next(new SessionError('error'));
        }
        else{
            //ADD CODE HERE
            var cook = null;
            var split_cookies = request.headers.cookie.split("; ");
            split_cookies.forEach(element => {
                if(element.substring(0,16) == 'cpen400a-session'){
                    cook = element.substring(17);
                }
                })
            if (sessions[cook] == null || cook == null){
                next(new SessionError('error'));
            }
            else{
                request.username = sessions[cook].username;
                request.session = cook;
                next();
            }
        }
        //console.log(split_cookies);
        //console.log(request.headers.cookie);
		//console.log(cook);
	};

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;