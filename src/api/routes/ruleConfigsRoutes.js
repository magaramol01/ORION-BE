'use strict';

const ruleConfigsModel = require('../models/ruleConfigsModel');
const RuleConfigsController = require("../controllers/ruleConfigController");

module.exports = async function (fastify, opts) {

    fastify.get('/getRuleConfigsJson', async function (request, reply) {
        return {ruleConfigsJson: await ruleConfigsModel.getRuleConfigsJsonData()};
    });

    fastify.get('/syncRuleConfigsJson', async function (request, reply) {
        return {ruleConfigsJson: await ruleConfigsModel.syncRuleConfigsJsonData()};
    });

    fastify.post('/createRuleConfig', async function (request, reply) {
        const response = await RuleConfigsController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createRuleConfig :: ', reply.getResponseTime());
    });

    fastify.get('/getRuleConfigById:ruleConfigId', async function (request, reply) {
        const response = await RuleConfigsController.readById(request.query.ruleConfigId);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getRuleConfigById:ruleConfigId :: ', reply.getResponseTime());
    });

    fastify.get('/getAllRuleConfigs', async function (request, reply) {
        const response = await RuleConfigsController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllRuleConfigs :: ', reply.getResponseTime());
    });

    fastify.get('/getAllRuleConfigsByShip', async function (request, reply) {
        const response = await RuleConfigsController.readAllByShipForPagination(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllRuleConfigs :: ', reply.getResponseTime());
    });

    fastify.post('/updateRuleConfig', async function (request, reply) {
        const response = await RuleConfigsController.update(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/updateRuleConfig :: ', reply.getResponseTime());
    });

    fastify.get('/getAllRuleOnlyNames', async function (request, reply) {
        const response = await RuleConfigsController.readAllOnlyNames();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllRuleOnlyNames :: ', reply.getResponseTime());
    });

    fastify.post('/deleteRule', async function (request, reply) {
        const response = await RuleConfigsController.removeById(request.query.id);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/deleteRule :: ', reply.getResponseTime());
    });

};
