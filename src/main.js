const express = require('express');
const socketio = require('socket.io');

const Connection = require('./connection.js');
const DataFile = require('./data_file.js');

const PORT = 3000;

const app = express();
const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const io = socketio(server);


app.get('/open', (req, res) => {
  res.send('<p>Specify file to open: <code>/open/&lt;file-name&gt;</code></p>');
  next();
});

app.get("/open/:file", (req, res) => {
  res.redirect('/index.html#' + req.params.file);
  next();
});

app.use(express.static("public/"));

DataFile.loadFiles();

io.on('connection', (socket) => new Connection(socket));