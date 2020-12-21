const express = require('express');
const socketio = require('socket.io');

const Connection = require('./connection.js');
const DataFile = require('./data_file.js');

const PORT = 3000;

const app = express();
const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const io = socketio(server);

app.use(express.static("public/"));

DataFile.loadFiles();

io.on('connection', (socket) => new Connection(socket));