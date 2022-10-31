'use strict';

const parameterCsvController = require('../controllers/parameterCsvController');

module.exports = async function (fastify, opts) {

    fastify.get('/getLastParameterFile', async function (request, reply) {
        let failureAdvisoriesJson = await parameterCsvController.lastParameterFile(request);

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(failureAdvisoriesJson));

        console.log(reply.getResponseTime());
    });

    fastify.get('/downloadParameterCsv', async function (request, reply) {
        let failureAdvisoriesJson = await parameterCsvController.downloadParameterCsvData(request);

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(failureAdvisoriesJson));

        console.log(reply.getResponseTime());
    });

};
