var Docker = require('dockerode');
var debug = require('debug')('lib:server');
var fs = require('fs');
var ws = require('ws');

var socket = '/var/run/docker.sock';
var stats  = fs.statSync(socket);
if (!stats.isSocket()) {
  throw new Error('Are you sure the docker is running?');
}
var docker = new Docker({ socketPath: socket });

// First run, with -dit flags, saving down the container id or name
var container = docker.getContainer('servertest');

function execTtyWithSocket(container, webSocket) {
  var options = {
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: true,
    Tty: true,
    Cmd: ['/bin/bash']
  };
  return container.exec(options,(err, exec) => {
    if(err) throw err;
    exec.start((err, stream) => {
      if(err) throw err;
      // console.log(stream);
      stream.on('message',(msg) => {
        console.log('error should not pop here')
        webSocket.send(msg,{},()=>{console.log(msg+'sent');});
        console.log('but should have popped by now')
      });
      webSocket.on('message',(msg) => {
        stream.write(msg,'utf-8',()=>{console.log(msg+'recieved');});
      });
    })
  })
};

var server = new ws.Server({port: 8080});
server.on('connection',(webSocket) => {
  console.log('connecting')
  var execObj = execTtyWithSocket(container, webSocket);
  console.log('connected')
  webSocket.on('close',(code, message) => {
    console.log('closed, this part needs work');
  });
});
console.log('ready');
console.log('really ready');

