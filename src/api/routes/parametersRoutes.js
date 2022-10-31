'use strict';

const parametersModel = require('../models/parametersModel');
const ParametersController = require('../controllers/parametersController');

module.exports = async function (fastify, opts) {

    fastify.get('/getParametersJson', async function (request, reply) {
        return {parametersJson:await parametersModel.getParametersJsonData()};
    });

    fastify.get('/syncParametersJson', async function (request, reply) {
        return {parametersJson: await parametersModel.syncParametersJsonData()};
    });

    fastify.post('/createParameter', async function (request, reply) {
        const response = await ParametersController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createParameter :: ', reply.getResponseTime());
    });

    fastify.get('/getParameterById:parameterId', async function (request, reply) {
        const response = await ParametersController.readById(request.query.parameterId);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getParameterById:parameterId :: ', reply.getResponseTime());
    });

    fastify.get('/getAllParameters', async function (request, reply) {
        const response = await ParametersController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllParameters :: ', reply.getResponseTime());
    });

    fastify.get('/getAllParametersByShip', async function (request, reply) {
        const response = await ParametersController.readAllByShipForPagination(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllParameters :: ', reply.getResponseTime());
    });

    fastify.post('/updateParameter', async function (request, reply) {
        const response = await ParametersController.update(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/updateParameter :: ', reply.getResponseTime());
    });

    fastify.post('/deleteParameter', async function (request, reply) {
        const response = await ParametersController.removeById(request.query.id);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/deleteParameter :: ', reply.getResponseTime());
    });

    fastify.get('/getAllParametersOnlyNames', async function (request, reply) {
        const response = await ParametersController.readAllOnlyNames(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllParametersOnlyNames :: ', reply.getResponseTime());
    });

    fastify.get('/getAllParametersOnlyNamesByShip', async function (request, reply) {
        const response = await ParametersController.readAllOnlyNamesByShip(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllParametersOnlyNames :: ', reply.getResponseTime());
    });
};
