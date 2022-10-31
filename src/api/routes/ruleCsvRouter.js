'use strict';

const ruleCsvController = require('../controllers/ruleCsvController');

module.exports = async function (fastify, opts) {

    fastify.get('/getLastRuleFile', async function (request, reply) {
        let failureAdvisoriesJson = await ruleCsvController.lastRuleFile(request);

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(failureAdvisoriesJson));

        console.log(reply.getResponseTime());
    });

    fastify.get('/downloadRuleCsv', async function (request, reply) {
        let failureAdvisoriesJson = await ruleCsvController.downloadRuleCsvData(request);

        reply
            .code(200)
            .header('Content-Type','application/json; charset=utf-8')
            .send(JSON.stringify(failureAdvisoriesJson));

        console.log(reply.getResponseTime());
    });

};
