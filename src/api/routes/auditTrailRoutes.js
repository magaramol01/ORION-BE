'use strict';

const AuditTrailController = require("../controllers/auditTrailController");

module.exports = async function (fastify, opts) {

    fastify.get('/getAllAuditTrails', async function (request, reply) {
        const response = await AuditTrailController.readAll();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllAuditTrails :: ', reply.getResponseTime());
    });

    fastify.get('/getAuditTrailById', async function (request, reply) {
        const response = await AuditTrailController.readById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAuditTrailById :: ', reply.getResponseTime());
    });

    fastify.post('/createAuditTrail', async function (request, reply) {
        const response = await AuditTrailController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createAuditTrail :: ', reply.getResponseTime());
    });

};
