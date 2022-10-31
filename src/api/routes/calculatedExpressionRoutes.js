'use strict';

const CalculatedExpressionController = require("../controllers/calculatedExpressionController");

module.exports = async function (fastify, opts) {

    fastify.post('/createCalculatedExpression', async function (request, reply) {
        const response = await CalculatedExpressionController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createCalculatedExpression :: ', reply.getResponseTime());
    });

    fastify.get('/getAllCalculatedExpression', async function (request, reply) {
        const response = await CalculatedExpressionController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllCalculatedExpression :: ', reply.getResponseTime());
    });

    fastify.post('/updateCalculatedExpression', async function (request, reply) {
        const response = await CalculatedExpressionController.update(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/updateCalculatedExpression :: ', reply.getResponseTime());
    });

};
