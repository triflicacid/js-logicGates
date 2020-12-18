const express = require('express');
const socketio = require('socket.io');

const PORT = 3000;

const app = express();
const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const io = socketio(server);

app.use(express.static("public/"));

io.on('connection', socket => {
  console.log(`Socket connected: ${socket.id}`);
  socket.emit('message', { msg: 'Hello... Your ID is ' + socket.id });
});