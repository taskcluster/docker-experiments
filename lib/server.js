var Docker = require('dockerode');
var debug = require('debug')('lib:server');
var fs = require('fs');
var ws = require('ws');
var through = require('through');

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
    exec.start(attachoptions, (err, stream) => {
      if(err) throw err;
      var strout = through((data) => {
        webSocket.send(data,{},()=>{debug('%s sent through stdout',data);});
      });
      var strerr = through((data) => {
        webSocket.send(data,{},()=>{debug('%s sent through stderr',data);});
      });
      exec.modem.demuxStream(stream, strout, strerr);
      webSocket.on('message',(msg) => {
        debug('message about to be sent is %s',msg)
        stream.write(msg);
        //stream.write(msg,'utf-8',()=>{debug(msg+'recieved');});
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

