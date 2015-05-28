var Docker = require('dockerode');
var fs = require('fs');
var ws = require('ws');

var port = 8080

var socket = '/var/run/docker.sock';
var stats  = fs.statSync(socket);
if (!stats.isSocket()) {
  throw new Error('Are you sure the docker is running?');
}
var docker = new Docker({ socketPath: socket });

var server = new ws.Server({port: port});

server.on('connection',(ws) => {console.log('asd')});

console.log('ready');

/*
First run, saving down the container id
then exec in the thing
and 
*/

