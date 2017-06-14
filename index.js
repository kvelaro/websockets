var webSocket = require('./server');
webSocket.listen('localhost', 8080, function(conn) {
    console.log('Websocket server started');
});