var ws = require('ws');
var debug = require('debug')('lib:client');
var express = require('express');
var http = require('http');
var terminal = require('term.js');
var io = require('socket.io');

var stream;
if (process.argv[2] === '--dump') {
  stream = require('fs').createWriteStream(__dirname + '/dump.log');
}

var buff = [];
var termSocket;
var dockerSocket = new ws('ws://127.0.0.1:8081');
dockerSocket.on('data', function(data) {
  if (stream) stream.write('OUT: ' + data + '\n-\n');
  return !termSocket
    ? buff.push(data)
    : termSocket.emit('data', data);
});

var app = express()
var server = http.createServer(app);

app.use(function(req, res, next) {
  var setHeader = res.setHeader;
  res.setHeader = function(name) {
    switch (name) {
      case 'Cache-Control':
      case 'Last-Modified':
      case 'ETag':
        return;
    }
    return setHeader.apply(res, arguments);
  };
  next();
});

app.use(express.static(__dirname));
app.use(terminal.middleware());
server.listen(8080);

io = io.listen(server, {
  log: false
});

io.sockets.on('connection', function(sock) {
  termSocket = sock;

  termSocket.on('data', function(data) {
    if (stream) stream.write('IN: ' + data + '\n-\n');
    //console.log(JSON.stringify(data));
    dockerSocket.send(data);
  });

  termSocket.on('disconnect', function() {
    termSocket = null;
  });

  while (buff.length) {
    termSocket.emit('data', buff.shift());
  }
});

debug('client ready');


// webSocket.on('open',() => {
//   setTimeout(() => {
//     debug('message being sent');
//     webSocket.send('echo a\r\n');
//   },2000);
// });
// webSocket.on('message', msg => {
//   debug('message recieved');
//   debug(msg);
// });
// setTimeout(() => {webSocket.close()},10000);