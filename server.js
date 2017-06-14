// See The WebSocket Protocol for the official specification
// http://tools.ietf.org/html/rfc6455

var events = require('events');
var http = require('http');
var crypto = require('crypto');
var util = require('util');
var randomstring = require('randomstring');

// opcodes for WebSocket frames
// http://tools.ietf.org/html/rfc6455#section-5.2
var opcodes = {
    TEXT: 1,
    BINARY: 2,
    CLOSE: 8,
    PING: 9,
    PONG: 10
};

var WebSocketConnection = function(req, socket, upgradeHead) {
    var self = this;
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.closed = false;

    var key = self.hashWebSocketKey(req.headers['sec-websocket-key']);
    // handshake response
    // http://tools.ietf.org/html/rfc6455#section-4.2.2

    socket.write(
        'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
        'Upgrade: WebSocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Accept: ' + key +
        '\r\n\r\n'
    );

    setInterval(function() {
        var payload = Buffer.from(randomstring.generate(), 'utf8');
        self.send(opcodes.PING, payload);
    }, 1000);

    socket.on('data', function(buffer) {
        console.log(buffer);
    });

    // socket.on('close', function(err) {
    //     if(self.closed == false) {
    //
    //         self.closed = true;
    //     }
    // });

}
util.inherits(WebSocketConnection, events.EventEmitter);

WebSocketConnection.prototype.hashWebSocketKey = function(key) {
    var KEY_SUFFIX = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    var sha1 = crypto.createHash('sha1');
    sha1.update(key + KEY_SUFFIX, 'ascii');
    return sha1.digest('base64');
};

WebSocketConnection.prototype.send = function(opcode, payload) {
    var b1 = 0x80;
    b1 |= opcode;

    var bufferLen = payload.length;

    var b2 = 0x0;
    if(bufferLen <= 125) {
        b2 |= bufferLen;
    }

    var frame = Buffer.alloc(bufferLen + 2);
    frame.writeUInt8(b1);
    frame.writeUInt8(b2, 1);
    payload.copy(frame, 2);

    // console.log(frame);
    this.socket.write(frame);



}

//     if(Buffer.isBuffer(buffer)) {
//         opcode = opcodes.BINARY;
//         payload = buffer;
//     }
//     else if(typeof buffer == 'string') {
//         opcode = opcodes.TEXT;
//         payload = Buffer.from(buffer, 'utf8');
//     }
//     else {
//         throw new Error('Unknown type');
//     }
//     this._doSend(opcode, payload);

//
// WebSocketConnection.prototype.close = function(code, reason) {
//     var opcode = opcodes.CLOSE;
//     var payload;
//
//     buffer = Buffer.alloc(Buffer.byteLength(reason) + 2);
//     buffer.writeUInt16BE(0);
// }

exports.listen = function(host, port,  connectionHandler) {
    var srv = http.createServer(function(req, res) {});

    srv.on('upgrade', function(req, socket, head) {
        var ws = new WebSocketConnection(req, socket, head);
        connectionHandler(ws);
    });

    srv.listen(port, host);
}