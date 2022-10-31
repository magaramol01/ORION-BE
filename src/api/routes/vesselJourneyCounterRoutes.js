'use strict';

const {Util} = require("../utils/util");
const VesselJourneyCounterModel = require("../models/vesselJourneyCounterModel");

module.exports = async function (fastify, opts) {

    fastify.get('/syncVesselJourneyCounter', async function (request, reply) {
        await VesselJourneyCounterModel.syncVesselJourneyCounterJsonData();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data sync successfully !"));

        Util.printLog("/syncVesselJourneyCounter served in : " + reply.getResponseTime());
    });

    fastify.post('/insertVesselJourneyCounter', async function (request, reply) {
        const data = request.body;
        await VesselJourneyCounterModel.insertData(data);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data inserted successfully in Vessel Journey Counter table!!!"));

        Util.printLog("/syncVesselJourneyCounter served in : " + reply.getResponseTime());
    });

    fastify.post('/updateVesselJourneyCounter', async function (request, reply) {
        const data = request.body;
        await VesselJourneyCounterModel.updateCounterByVesselId(data.vesselId, data.journeyCounter);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data inserted successfully in Vessel Journey Counter table!!!"));

        Util.printLog("/syncVesselJourneyCounter served in : " + reply.getResponseTime());
    });

};