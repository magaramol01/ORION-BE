'use strict';

module.exports = async function (fastify, opts) {

    fastify.get('/getApplicationStatus', async function (request, reply) {

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send("Running");

        console.log('/getApplicationStatus :: ', reply.getResponseTime());
    });

};