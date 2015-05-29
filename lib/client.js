var ws = require('ws');
var debug = require('debug')('lib:client');

var webSocket = new ws('ws://127.0.0.1:8080');
webSocket.on('open',() => {
  setTimeout(() => {
    debug('message being sent');
    webSocket.send('echo a\r\n');
  },2000);
});
webSocket.on('message', msg => {
  debug('message recieved');
  debug(msg);
});
setTimeout(() => {webSocket.close()},10000);