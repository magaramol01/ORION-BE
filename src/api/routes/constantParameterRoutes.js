'use strict';

const ConstantParametersController = require("../controllers/constantParametersController");

module.exports = async function (fastify, opts) {

    fastify.get('/getAllConstantParameter', async function (request, reply) {
        const response = await ConstantParametersController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllConstantParameter :: ', reply.getResponseTime());
    });

    fastify.post('/createConstantParameter', async function (request, reply) {
        const response = await ConstantParametersController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createConstantParameter :: ', reply.getResponseTime());
    });

    fastify.post('/getConstantParameterHistoricalDataById', async function (request, reply) {
        const response = await ConstantParametersController.readAllConstantParameterHistoricalDataById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getConstantParameterHistoricalDataById :: ', reply.getResponseTime());
    });

    fastify.post('/updateOnlyCurrentAndRemarkConstantParameter', async function (request, reply) {
        const response = await ConstantParametersController.updateConstantParameterData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/updateOnlyCurrentAndRemarkConstantParameter :: ', reply.getResponseTime());
    });

};
