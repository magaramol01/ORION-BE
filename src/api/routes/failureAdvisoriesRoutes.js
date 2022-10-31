'use strict';

const failureAdvisoriesModel = require('../models/failureAdvisoriesModel');
const FailureAdvisoriesController = require('../controllers/failureAdvisoriesController');

module.exports = async function (fastify, opts) {

    fastify.get('/getFailureAdvisoriesJson', async function (request, reply) {
        let failureAdvisoriesJson = await failureAdvisoriesModel.getFailureAdvisoriesJsonData();

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(failureAdvisoriesJson));

        console.log(reply.getResponseTime());
    });

    fastify.get('/syncFailureAdvisoriesJson', async function (request, reply) {
        let failureAdvisoriesJson = await failureAdvisoriesModel.syncFailureAdvisoriesJsonData();

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(failureAdvisoriesJson));

        console.log(reply.getResponseTime());
    });

    fastify.post('/createFailureAdvisory', async function (request, reply) {
        const response = await FailureAdvisoriesController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log(reply.getResponseTime());
    });

    fastify.get('/getFailureAdvisoryById:failureAdvisoryId', async function (request, reply) {
        const response = await FailureAdvisoriesController.readById(request.query.failureAdvisoryId);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log(reply.getResponseTime());
    });

    fastify.get('/getAllFailureAdvisories', async function (request, reply) {
        const response = await FailureAdvisoriesController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllFailureAdvisories :: ', reply.getResponseTime());
    });

    fastify.get('/getAllFailureAdvisoriesByShip', async function (request, reply) {
        const response = await FailureAdvisoriesController.readAllByShipForPagination(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllFailureAdvisories :: ', reply.getResponseTime());
    });

    fastify.post('/updateFailureAdvisory', async function (request, reply) {
        const response = await FailureAdvisoriesController.update(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/updateFailureAdvisory :: ', reply.getResponseTime());
    });

    fastify.post('/deleteFailureAdvisory', async function (request, reply) {
        const response = await FailureAdvisoriesController.removeById(request.query.id);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/deleteFailureAdvisory :: ', reply.getResponseTime());
    });
    fastify.get('/getAllShipDataUrl', async function (request, reply) {
        const response = await FailureAdvisoriesController.getAllShipData(request)

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllFailureAdvisories :: ', reply.getResponseTime());
    });

};
