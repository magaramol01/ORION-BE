'use strict';

const {Util} = require("../utils/util");
const FleetDashboardController = require('../controllers/fleetDashboardController');

module.exports = async function (fastify, opts) {

    fastify.get('/getFleetDashboardState:vesselId', async function (request, reply) {
        const response = await FleetDashboardController.getFleetDashboardState(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getFleetDashboardState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getFleetDashboardParametersFilterData', async function (request, reply) {
        const response = await FleetDashboardController.getFleetDashboardParametersFilterData();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getFleetDashboardParametersFilterData served in : " + reply.getResponseTime());
    });

    fastify.get('/getFleetDashboardParametersCardData', async function (request, reply) {
        const response = await FleetDashboardController.getFleetDashboardParametersCardData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getFleetDashboardParametersCardData served in : " + reply.getResponseTime());
    });

    fastify.get('/getAllShipSourceDastinationData', async function (request, reply) {
        const response = await FleetDashboardController.allShipSourceDastinationData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getFleetDashboardParametersCardData served in : " + reply.getResponseTime());
    });
};
