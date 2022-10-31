'use strict';

const ModbusDataTrackerHistoryController = require("../controllers/modbusDataTrackerHistoryController");

module.exports = async function (fastify, opts) {

    fastify.get('/getAllModbusTrackerDataHistory', async function (request, reply) {
        let response = await ModbusDataTrackerHistoryController.getAllModbusTrackerDataHistory(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllModbusTrackerDataHistory :: ', reply.getResponseTime());
    });

    fastify.get('/getModbusTrackerDataHistoryByVesselId', async function (request, reply) {
        const response = await ModbusDataTrackerHistoryController.getModbusTrackerDataHistoryByVesselId(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getModbusTrackerDataHistoryByVesselId :: ', reply.getResponseTime());
    });

    fastify.get('/getModbusTrackerDataHistoryByVesselIdAndPagination', async function (request, reply) {
        const response = await ModbusDataTrackerHistoryController.getModbusTrackerDataHistoryByVesselIdAndPagination(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getModbusTrackerDataHistoryByVesselIdAndPagination :: ', reply.getResponseTime());
    });

    fastify.get('/getModbusTrackerDataHistoryByVesselIdAndDates', async function (request, reply) {
        const response = await ModbusDataTrackerHistoryController.getModbusTrackerDataHistoryByVesselIdAndDates(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getModbusTrackerDataHistoryByVesselIdAndDates :: ', reply.getResponseTime());
    });

};
