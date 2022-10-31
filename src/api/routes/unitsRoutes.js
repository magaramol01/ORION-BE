'use strict';

const UnitsController = require("../controllers/unitsController");

module.exports = async function (fastify, opts) {

    fastify.get('/getAllUnits', async function (request, reply) {
        let response = await UnitsController.readAll();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllUnits :: ', reply.getResponseTime());
    });

    fastify.post('/createUnits', async function (request, reply) {
        const response = await UnitsController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createUnits :: ', reply.getResponseTime());
    });

    fastify.post('/deleteUnits', async function (request, reply) {
        const response = await UnitsController.removeById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/deleteUnits :: ', reply.getResponseTime());
    });
};
