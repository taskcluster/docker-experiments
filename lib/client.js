var ws = require('ws');
var debug = require('debug')('lib:client');

var webSocket = new ws('ws://127.0.0.1:8080');
webSocket.on('open',() => {
  webSocket.send('echo a');
});
webSocket.on('message', msg => {
  console.log(msg);
});
// setTimeout(webSocket.close,10000);