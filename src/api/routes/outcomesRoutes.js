"use strict";

const OutcomesController = require("../controllers/outcomesController");

module.exports = async function (fastify, opts) {

    fastify.get('/getAllRuleEngineData', async function (request, reply) {
        const response = await OutcomesController.getAllRuleEngineData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllRuleEngineData :: ', reply.getResponseTime());
    });

    fastify.get('/getAllRuleEngineDataByShip', async function (request, reply) {
        const response = await OutcomesController.getAllRuleEngineDataByShip(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllRuleEngineData :: ', reply.getResponseTime());
    });

    fastify.get('/getAllOutcomes', async function (request, reply) {
        const response = await OutcomesController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllOutcomes :: ', reply.getResponseTime());
    });

    fastify.get('/getAllOutcomesByShip', async function (request, reply) {
        const response = await OutcomesController.readAllByShip(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllOutcomes :: ', reply.getResponseTime());
    });

    fastify.post('/configureOutcome', async function (request, reply) {
        const response = await OutcomesController.configureOutcome(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/configureOutcome :: ', reply.getResponseTime());
    });

    fastify.post('/updateOutcome', async function (request, reply) {
        const response = await OutcomesController.updateOutcome(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/configureOutcome :: ', reply.getResponseTime());
    });

    fastify.post('/deleteOutcome', async function (request, reply) {
        const response = await OutcomesController.removeOutcomeById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/deleteOutcome :: ', reply.getResponseTime());
    });

    fastify.post('/setResetEmailForFailureAdvisoriesRefCause', async function (request, reply) {
        const response = await OutcomesController.setResetEmailForFailureAdvisoriesRefCause(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/setResetEmailForFailureAdvisoriesRefCause :: ', reply.getResponseTime());
    });

};
