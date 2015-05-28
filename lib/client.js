var ws = require('ws');

var webSocket = new ws('ws://127.0.0.1:8080/');
webSocket.send('hallo');
