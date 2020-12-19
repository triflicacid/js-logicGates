const express = require('express');
const socketio = require('socket.io');

const Connection = require('./src/connection.js');
const DataFile = require('./src/data_file.js');

const PORT = 3000;

const app = express();
const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const io = socketio(server);

app.use(express.static("public/"));

DataFile.loadFiles();

io.on('connection', (socket) => {
  let conn = new Connection(socket);
});