'use strict';

const userWidgetsParametersController = require("../controllers/userWidgetsParametersController");

module.exports = async function (fastify, opts) {

    fastify.post('/createUserWidgetsParameters', async function (request, reply) {
        const response = await userWidgetsParametersController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createUserWidgetsParameters :: ', reply.getResponseTime());
    });


    fastify.get('/getAllUserWidgetsParameters', async function (request, reply) {
        const response = await userWidgetsParametersController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/getAllUserWidgetsParameters :: ', reply.getResponseTime());
    });


};
