'use strict';

const {Util} = require("../utils/util");
const VoyageForecastModel = require("../models/voyageForecastModel");

module.exports = async function (fastify, opts) {

    fastify.get('/syncVoyageForecast', async function (request, reply) {
        await VoyageForecastModel.syncVoyageForecastJsonData();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data sync successfully !"));

        Util.printLog("/syncVoyageForecast served in : " + reply.getResponseTime());
    });

    fastify.get('/getVoyageForecastData', async function (request, reply) {
        await VoyageForecastModel.getVoyageForecastData();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data sync successfully !"));

        Util.printLog("/getVoyageForecastData served in : " + reply.getResponseTime());
    });

    fastify.get('/getVoyageForecastDataByVesselId', async function (request, reply) {
        await VoyageForecastModel.getVoyageForecastJsonDataByVesselId(parseInt(request.query.vesselId));

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data sync successfully !"));

        Util.printLog("/getVoyageForecastDataByVesselId served in : " + reply.getResponseTime());
    });

    fastify.post('/insertVoyageForecastData', async function (request, reply) {
        const data = request.body;
        await VoyageForecastModel.insertData(data);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data inserted successfully in Vessel Journey Counter table!!!"));

        Util.printLog("/insertVoyageForecastData served in : " + reply.getResponseTime());
    });

    fastify.post('/updateVoyageForecast', async function (request, reply) {
        const data = request.body;
        await VoyageForecastModel.updateData(data.vesselId, data.voyageForecastData);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data inserted successfully in Vessel Journey Counter table!!!"));

        Util.printLog("/updateVoyageForecast served in : " + reply.getResponseTime());
    });

};