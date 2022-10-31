'use strict';


const moblieApplicationController = require("../controllers/mobileApplicationController");

module.exports = async function (fastify, opts) {

    fastify.get('/getrtdasbyship/:shipid', async function (request, reply) {
        const response = await moblieApplicationController.getrtdasbyship(parseInt(request.params.shipid))
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getrtdasbyship :: ', reply.getResponseTime());
    });
};

