var express = require('express');
var http = require('http');
var terminal = require('term.js');
var io = require('socket.io');
var Docker = require('dockerode');
var debug = require('debug')('lib:both');
var fs = require('fs');
var through = require('through');

var socket = '/var/run/docker.sock';
var stats  = fs.statSync(socket);
if (!stats.isSocket()) {
  throw new Error('Are you sure the docker is running?');
}
var docker = new Docker({ socketPath: socket });
// First run, with -dit flags, saving down the container id or name
var container = docker.getContainer('servertest');

var dbgstream;
if (process.argv[2] === '--dump') {
  dbgstream = require('fs').createWriteStream(__dirname + '/dump.log');
}

function execTtyWithSocket(container, socket, buff) {
  var options = {
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: true,
    Tty: true,
    Detach: false,
    Cmd: ['/bin/bash'],
  };
  var attachoptions = {
    stdin: true,
    stdout: true,
    stderr: true,
    stream: true,
  };
  return container.exec(options,(err, exec) => {
    if(err) throw err;
    exec.start(attachoptions, (err, execStream) => {
      if(err) throw err;
      var strout = through(function(data) {
        debug('%s sent through stdout',data);
        this.emit('data',data);
      });
      var strerr = through(function(data) {
        debug('%s sent through stderr',data);
        this.emit('data',data);
      });
      exec.modem.demuxStream(execStream, strout, strerr);
      var strfinal = through((data) =>{
      	if (dbgstream) dbgstream.write('OUT: ' + data + '\n-\n');
      	data = data.toString();
      	return !socket
      	  ? buff.push(data)
      	  : socket.emit('data', data);
      })
      strout.pipe(strfinal);
      strerr.pipe(strfinal);
      socket.on('data',(data) => {
        if (dbgstream) dbgstream.write('IN: ' + data + '\n-\n');
        execStream.write(data);
      });
      socket.on('disconnect',() => { 
        execStream.end('\r\nexit\r\n'); //figure out how to ctrl+c ctrl+d
      });
    })
  })
}


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
  var buff = [];
  execTtyWithSocket(container,sock,buff);
  while (buff.length) {
    termSocket.emit('data', buff.shift());
  }
});

debug('client ready');
