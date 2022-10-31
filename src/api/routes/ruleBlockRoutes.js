'use strict';

const ruleBlocksModel = require('../models/ruleBlocksModel');
const RuleBlocksController = require("../controllers/ruleBlocksController");

module.exports = async function (fastify, opts) {

    fastify.get('/getRuleBlocksJson', async function (request, reply) {
        console.log("getRuleBlocksJson");
        return {ruleBlocksJson: await ruleBlocksModel.getRuleBlocksJsonData()};
    });

    fastify.get('/syncRuleBlocksJson', async function (request, reply) {
        console.log("syncRuleBlocksJson");
        return {ruleBlocksJson: await ruleBlocksModel.syncRuleBlocksJsonData()};
    });

    fastify.post('/createRuleBlock', async function (request, reply) {
        const response = await RuleBlocksController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createRuleBlock :: ', reply.getResponseTime());
    });

    fastify.get('/getRuleBlockById:ruleBlockId', async function (request, reply) {
        const response = await RuleBlocksController.readById(request.query.ruleBlockId);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getRuleBlockById:ruleBlockId :: ', reply.getResponseTime());
    });

    fastify.get('/getAllRuleBlocks', async function (request, reply) {
        const response = await RuleBlocksController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllRuleBlocks :: ', reply.getResponseTime());
    });

    fastify.get('/getAllRuleBlocksByShip', async function (request, reply) {
        const response = await RuleBlocksController.readAllByShipForPagination(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllRuleBlocks :: ', reply.getResponseTime());
    });
    fastify.post('/updateRuleBlock', async function (request, reply) {
        if(request.body.ActivationState)
        {const response = await RuleBlocksController.updateActivationState(request);}
        else
        {const response = await RuleBlocksController.update(request);}
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send("Data Update");

        console.log('/updateRuleBlock :: ', reply.getResponseTime());
    });

    fastify.post('/deleteRuleBlock', async function (request, reply) {
        const response = await RuleBlocksController.removeById(request.query.id);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/deleteRuleBlock :: ', reply.getResponseTime());
    });

};
