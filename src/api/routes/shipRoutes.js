'use strict';

const ShipController = require("../controllers/shipController");
const UserController = require("../controllers/userController");
const machineController = require("../controllers/machineController");

module.exports = async function (fastify, opts) {
    fastify.post('/createShip', async function (request, reply) {
        const response = await ShipController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/createShip :: ', reply.getResponseTime());
    });

    fastify.post('/getShipDataById', async function (request,reply){
        const response = await ShipController.getById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getShipDataById ::', reply.getResponseTime());
    });

    fastify.post('/getShipData', async function(request,reply){
        const response = await ShipController.getAllData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getShipData ::', reply.getResponseTime());
    });

    fastify.post('/getShipBySisterGroup', async function(request,reply){
        const response = await ShipController.getAllShipBySister(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getShipBySisterGroup ::', reply.getResponseTime());
    });

    fastify.post('/getShipByFleetGroup', async function(request,reply){
        const response = await ShipController.getAllShipByFleet(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getShipByFleetGroup ::', reply.getResponseTime());
    });

    fastify.post('/deleteShipDataById', async function(request,reply){
        const response = await ShipController.deleteById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/deleteShipDataById ::', reply.getResponseTime());
    });

    fastify.post('/updateShipDataById', async function(request,reply){
        const response = await ShipController.updateById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/updateShipDataById ::', reply.getResponseTime());
    });

    fastify.post('/createShips', async function (request, reply) {
        const response = await ShipController.createMultiple(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/createShips :: ', reply.getResponseTime());
    });
    fastify.get('/getAllShips', async function(request,reply){
        //user -> shipNames
        const response = await UserController.getAllShips(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getAllShips ::', reply.getResponseTime());
    });
    fastify.get('/getAllShipsAndMachines', async function(request,reply){
        //user -> shipNames
        const response = {
            "shipArr": await UserController.getAllShips(request),
            "machineArr": await machineController.machinesForAlert(request)
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getAllShipsAndMachines ::', reply.getResponseTime());
    });
    fastify.get('/getAllShip', async function(request,reply){
        const response = await ShipController.getAllShip(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getAllShips ::', reply.getResponseTime());
    });
};
