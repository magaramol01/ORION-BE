'use strict';

const causesModel = require('../models/causesModel');
const CausesController = require("../controllers/causesController");

module.exports = async function (fastify, opts) {

    fastify.get('/getCausesJson', async function (request, reply) {
        let causesJson = await causesModel.getCausesJsonData();

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(causesJson));

        console.log('/getCausesJson :: ', reply.getResponseTime());
    });

    fastify.get('/syncCausesJson', async function (request, reply) {
        let causesJson = await causesModel.syncCausesJsonData();

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(causesJson));

        console.log('/syncCausesJson :: ', reply.getResponseTime());
    });

    fastify.post('/createCause', async function (request, reply) {
        const response = await CausesController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createCause :: ', reply.getResponseTime());
    });

    fastify.get('/getCauseById:causeId', async function (request, reply) {
        const response = await CausesController.readById(request.query.causeId);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getCauseById:causeId :: ', reply.getResponseTime());
    });

    fastify.get('/getAllCauses', async function (request, reply) {
        const response = await CausesController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllCauses :: ', reply.getResponseTime());
    });

    fastify.get('/getAllCausesByShip', async function (request, reply) {
        const response = await CausesController.readAllByShipForPagination(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllCauses :: ', reply.getResponseTime());
    });

    fastify.post('/updateCause', async function (request, reply) {
        const response = await CausesController.update(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/updateCause :: ', reply.getResponseTime());
    });

    fastify.post('/deleteCauses', async function (request, reply) {
        const response = await CausesController.removeById(request.query.id);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/deleteCauses :: ', reply.getResponseTime());
    });

};
