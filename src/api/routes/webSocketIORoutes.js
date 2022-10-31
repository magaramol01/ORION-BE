'use strict';

const WebSocketIO = require('socket.io');

module.exports = async function (fastify, opts) {

    fastify.get('/getWSConnection', async function (request, reply) {

        const IO = new WebSocketIO(fastify.server);

        IO.on("connection", (socket) => {
            console.log('New Client has connected to the server!');

            socket.on("FromAPI", () => {
                console.log("response on event a");
                socket.emit("FromAPI", 'hi client, data received');
            });

            // setTimeout(() => {
            //     console.log("Data emitted to client :: ");
            //     socket.emit("FromAPI", new Date())
            // }, 4000);

            setInterval(() => {
                console.log("Data emitted to client :: ");
                socket.emit("FromAPI", new Date())
            }, 1000);

            socket.on("disconnect", () => {
                console.log('The client has disconnected!');
            });
        });

        reply
            .code(200)
            .header('Content-Type','text/html; charset=utf-8')
            .send('Hiii');
            /*.send('<html><head></head><body>' +
                '<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script>\n' +
                '<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>\n' +
                '<script>\n' +
                '  $(function () {\n' +
                '    window.socket = io();\n' +
                '      socket.emit(\'a\', "adasda");\n' +
                '    $(\'form\').submit(function(e) {\n' +
                '      e.preventDefault(); // prevents page reloading\n' +
                '      socket.emit(\'chat message\', $(\'#m\').val());\n' +
                '      $(\'#m\').val(\'\');\n' +
                '      return false;\n' +
                '    });\n' +
                '  });\n' +
                '</script></body></html>');*/

        console.log('/getWSConnection :: ', reply.getResponseTime());
    });

    const getApiAndEmit = socket => {

        const response = new Date();
        // Emitting a new message. Will be consumed by the client
        socket.emit("FromAPI", response);
    };

};
