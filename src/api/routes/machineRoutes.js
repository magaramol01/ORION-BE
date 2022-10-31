'use strict';

const MachineController = require("../controllers/machineController");

module.exports = async function (fastify, opts) {

    fastify.get('/getAllMachines', async function (request, reply) {
        let response = await MachineController.readAll();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllMachines :: ', reply.getResponseTime());
    });

    fastify.post('/createMachine', async function (request, reply) {
        const response = await MachineController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createMachine :: ', reply.getResponseTime());
    });


    fastify.post('/deleteMachine', async function (request, reply) {
        const response = await MachineController.removeById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/deleteMachine :: ', reply.getResponseTime());
    });
};
