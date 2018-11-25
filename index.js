const express = require('express');
const app = express();
const server = require('http').Server(app);
server.listen(process.env.PORT || 3000);
const io = require('socket.io')(server);
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', socket => {
    socket.on('create or join', room => {
        var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
        var numClients = myRoom.length;
        if (numClients == 0) {
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients == 1) {
            socket.join(room);
            socket.emit('joined', room);
        } else {
            socket.emit('full', room);
        }
    });

    socket.on('ready', room => {
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('offer', offer => {
        socket.broadcast.to(offer.room).emit('offer', offer.sdp);
    });

    socket.on('candidate', candidateData => {
        console.log(candidateData.candidate);
        socket.broadcast.to(candidateData.room).emit('candidate', candidateData);
    })

    socket.on('answer', answer => {
        socket.broadcast.to(answer.room).emit('answer', answer.sdp);
    });
});