'use strict';

const vesselGroupController = require("../controllers/vesselGroupController");

module.exports = async function (fastify, opts) {

    fastify.post('/createVesselGroup', async function (request, reply) {
         const response = await vesselGroupController.create(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createSisterVesselGroup :: ', reply.getResponseTime());
    });

    fastify.post('/getAllVesselGroup', async function (request, reply) {
        let response = await vesselGroupController.readAll();
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getAllVesselGroup :: ', reply.getResponseTime());
    });

    fastify.post('/getAllVesselGroupWithUserFilter', async function (request, reply) {
        let response = await vesselGroupController.readAllSisterVesselWithUserFilter(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getAllVesselGroupWithUserFilter :: ', reply.getResponseTime());
    });

    fastify.post('/deleteSisterGroup', async function(request,reply){
        const response = await vesselGroupController.removeById(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/deleteShipDataById ::', reply.getResponseTime());
    });
};