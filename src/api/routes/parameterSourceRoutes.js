'use strict';

const ParameterSourcesController = require("../controllers/parameterSourcesController");

module.exports = async function (fastify, opts) {

    fastify.get('/getParameterSourceJson', async function (request, reply) {
        let response = await ParameterSourcesController.readAll();

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getParameterSourceJson :: ', reply.getResponseTime());
    });

    fastify.get('/getParameterSourceJsonAndUnits', async function (request, reply) {
        let response = await ParameterSourcesController.getParameterSourcesAndUnits(request);

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getParameterSourceJsonAndUnits :: ', reply.getResponseTime());
    });

};
