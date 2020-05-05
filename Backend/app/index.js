const path = require('path');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
var cors = require('cors');
var mongoose = require('mongoose');
var Message = require('./model/message.js');

mongoose.connect('mongodb://localhost/chat', function(err){
    if(err){
        console.log(err);
    }else{
        console.log('Connected to mongoDB');
    }
});

const { createMessage } = require('./chat-utils/message.js');
const { isActualString } = require('./chat-utils/validate');
const { Users } = require('./chat-utils/users');
const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
app.use(cors());

var io = socketIO(server);
var users = new Users();
io.set('transports', [ 'websocket' ]);
io.on('connection', (socket) => {
    Message.find({}, function(err, data){
        if(err) throw err;
        socket.emit('load old messages', data);
    });
    socket.on('leave', (params) => {
        socket.leave(params.room);
    });

    socket.on('join', (params, callback) => {

        if (!isActualString(params.name) || !isActualString(params.room)) {
            return callback('Bad request');
        }

        socket.join(params.room);
        users.removeUser(socket.id);
        users.addUser(socket.id, params.name, params.room);

        io.to(params.room).emit('updateUserList', users.getUserList(params.room));
        socket.emit('newMessage', createMessage('Admin', params.room, 'Welcome to the live chat app.'));
        socket.broadcast.to(params.room).emit('newMessage', createMessage('Admin', params.room, `${params.name} has joined.`));

        callback();
    });

    socket.on('createMessage', (message, callback) => {
        var user = users.getUser(socket.id);
       
        if (user && isActualString(message.text)) {
            let tempObj = createMessage(user.name, user.room, message.text);
            var saveUserMsg = {
                name: user.name,
                msg: message.text
            }            
            Message.create(saveUserMsg , function( err , ins ){
                if(err) throw err ;
                io.to(user.room).emit('newMessage', tempObj);
                callback({
                    data: tempObj
                });        
            });            
        }
        callback();
    });

    socket.on('disconnect', () => {
        var user = users.removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('updateUserList', users.getUserList(user.room));
            io.to(user.room).emit('newMessage', createMessage('Admin', user.room, `${user.name} has left.`));
        }
    });

});


server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});


