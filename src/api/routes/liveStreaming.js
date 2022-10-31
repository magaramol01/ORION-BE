'use strict';

const VesselConfigurationController = require("../controllers/VesselConfigurationController");
const RuleEngineController = require("../controllers/ruleEngineController");

module.exports = async function (fastify, opts) {

    fastify.post('/getLiveDataUpdate', async function (request, reply) {
        /*
            * TODO : Introduce one layer in isBetween this which will read data
            * from database or
            * from third party API or
            * third party API will call this API and send required data to it
            * */
        // layer1();

        const response = new RuleEngineController().checkLiveValue(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));
        console.log(reply.getResponseTime());
    });

    function layer1() {

    }

    fastify.get('/syncJsonFiles', async function (request, reply) {
        new RuleEngineController().syncAllJsonFiles();
        reply
            .code(200)
            .send("Json Files Sync Successfully...");
    });

    fastify.get('/getAllData', async function (request, reply) {
        const data = VesselConfigurationController.getAllData();
        reply
            .code(200)
            .send(JSON.stringify(data));
    });

};
