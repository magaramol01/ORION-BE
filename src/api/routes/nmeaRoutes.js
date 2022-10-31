'use strict';

const NMEAControllerSingleton = require("../controllers/nmeaController");
const {Util} = require("../utils/util");

module.exports = async function (fastify, opts) {

    fastify.post('/C01D9919-DD67-4099-8B0A-4D08E230F0AE', async function (request, reply) {
        const NMEAController = NMEAControllerSingleton.getInstance();
        NMEAController.consumeNMEAData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("GPS NMEA AIPL data received successfully !"));

        Util.printLog("/consumeNMEAData served in : " + reply.getResponseTime());
    });

    fastify.get('/getAllVesselsWindyMapData', async function (request, reply) {
        const NMEAController = NMEAControllerSingleton.getInstance();
        const allVesselsWindyMapData = await NMEAController.getAllVesselsWindyMapData(request, reply);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(allVesselsWindyMapData);

        Util.printLog("/getAllVesselsWindyMapData served in : " + reply.getResponseTime());
    });

    fastify.get('/getWindyMapData', async function (request, reply) {
        const NMEAController = NMEAControllerSingleton.getInstance();
        const windyMapData = await NMEAController.getWindyMapData(request, reply);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(windyMapData);

        Util.printLog("/getWindyMapData served in : " + reply.getResponseTime());
    });

};