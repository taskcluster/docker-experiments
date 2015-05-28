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
    Detach: false,
    Cmd: ['/bin/bash']
  };
  return container.exec(options,(err, exec) => {
    if(err) throw err;
    debug('exec: %j',exec);
    exec.start((err, stream) => {
      if(err) throw err;
      debug('stream: %j',stream);
      stream.pipe(process.stdout);
      stream.on('message',(msg) => {
        // debug('error should not pop here')
        webSocket.send(msg,{},()=>{debug(msg+'sent');});
        // debug('but should have popped by now')
      });
      webSocket.on('message',(msg) => {
        debug(msg)
        stream.write(msg,'utf-8',()=>{debug(msg+'recieved');});
      });
    })
  })
};

var server = new ws.Server({port: 8080});
server.on('connection',(webSocket) => {
  debug('connecting')
  var execObj = execTtyWithSocket(container, webSocket);
  debug('connected')
  webSocket.on('close',(code, message) => {
    debug('closed, this part needs work');
  });
});
debug('ready');

