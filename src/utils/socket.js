let io;
exports.socketConnection = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: '*',
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected to socket!');
        socket.on('disconnect', () => {
            console.log('Client disconnected from socket');
        });
    });
}

exports.sendAlert = (alert) => io.emit('newAlert', alert);
exports.sendExtractionStatus = (status) => io.emit('newExtractionStatus', status)