
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var usersMap = new Map();

// This message can be anything you want to broadcast 
// (Message count/Messages) should be equivalent to Screen dislay count
var message = ["Lets us have", "a smoke free", "and breathe free", "DIWALI"];

// optional : this is just to add empty messages inorder to clear the marquee  
var emptySpaces = Array.from({ length: message.length}, () => "")
message = message.concat(emptySpaces);

var lastUsersCount = 0;

// Loop counter for message
var counter = 0;

// message delay time between each PC 
var pcDelay = 800;

// Boot up delay 
var startupDelay = 10000;

// Extra Time for all timeout to be finished 
var intervalBufferTime = 1000;

// Whenever someone connects this gets executed
io.on('connection', function(socket) {
    
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        
        var socketID = String(socket.id);  
        if(usersMap.has(socketID)){
            usersMap.delete(socketID);
        }
        
        console.log('A user disconnected');
        printUsersCount();
        
    });  
    
    socket.on('register', function(data){
        
        var clientID = data['socketID'];
        var sequenceID = data['sequenceId'];
        
        console.log('Register Client : clientID '+ clientID + " uniID "+ sequenceID);
        usersMap.set(clientID, parseInt(sequenceID));
    });
    
    // connection 
    console.log('A user connected '+ socket.id);
    printUsersCount();    
});

app.get('/', function(req, res) { 
    res.sendfile('index.html');
});

// not sure if this is the right way to do ; I did'nt research coz brevity of time
app.get('/jquery.js', function(req, res) { 
    res.sendfile('jquery.js');
});

app.get('/fireworks.js', function(req, res) { 
    res.sendfile('fireworks.js');
});

app.get('/fireworks.css', function(req, res) { 
    res.sendfile('fireworks.css');
});

app.get('/texteffect.css', function(req, res) { 
    res.sendfile('texteffect.css');
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});

// SET BROADCAST INTERVAL
var broadcastFunction = function(){
    printUsersCount("\n\nInterval ");
    sortUsers();
    
    // Reset the marquee because either members left/joined
    if(lastUsersCount != getUsersCount()){
        counter = 0;
    }
    
    var clientIDs = getUsersClientIDList();
    var sequenceIds = getUsersUniqueIDList();
    
    print('SeqIds: '+ sequenceIds)
    
    for (let i=1; i <= getUsersCount(); i++){
        setTimeout(function(){ broadcastMessage(clientIDs[i - 1], sequenceIds[i - 1], getMessagePart()); }
        , i * pcDelay);
    }
    
    // cancel previous broadcast 
    clearInterval(interval);
    
    // Each broadcast window should be after all the broadcast has been made + fixed wait time.
    var intervalWaitTime =  pcDelay * getUsersCount();

    // when user count is zero, this broadcast shouldn't loop at 0 ms so a default wait time
    intervalWaitTime = intervalWaitTime == 0 ? startupDelay - intervalBufferTime : intervalWaitTime;
    
    // reference to cancel the previous one when setting up a new one
    interval = setInterval(broadcastFunction, intervalWaitTime + intervalBufferTime);
    
    // reference of old value 
    lastUsersCount = getUsersCount();
};

var interval = setInterval(broadcastFunction, startupDelay);

function broadcastMessage(clientId, id, message){
    var jsonObject = {
        seqId : id,
        msg: message
    };
    
    console.log('broadcast[ sequence : '+id+'] :'+ message);
    io.to(clientId).emit('diwaliMessage', jsonObject);
}

function getUsers(){
    return usersMap;
}

function getUsersCount(){
    return getUsers().size;
}

function sortUsers(){
    usersMap = new Map([...usersMap.entries()].sort((a, b) => a[1] - b[1]));
}

function getUsersUniqueIDList(){
    return [...getUsers().values()];
}

function getUsersClientIDList(){
    return [...getUsers().keys()];
}

function getMessagePart(){
    if(counter > (message.length - 1)){
        counter = 0;
    }
    return message[counter++];
}

function printUsers(){
    for (let [key, value] of getUsers()) {     // get data sorted
        console.log(key + ' ' + value);
    }
}

function printUsersCount(message = ""){
    console.log(message + "Registered Users : " + getUsersCount());
}

function print(message){
    console.log(message);
}