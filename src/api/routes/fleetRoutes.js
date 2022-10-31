'use strict';

const fleetController = require("../controllers/fleetController");

module.exports = async function (fastify, opts) {

    fastify.post('/createFleet', async function (request, reply) {

        const response = await fleetController.create(request);


        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createFleet :: ', reply.getResponseTime());
    });



    fastify.post('/getAllFleetData', async function (request, reply) {

        console.log("----------------get fleet group --------------");
        let response = await fleetController.readAll();
        console.log(response);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/getAllFleeeData :: ', reply.getResponseTime());
    });

    fastify.post('/getAllFleetDataWithUserFilter', async function (request, reply) {
        let response = await fleetController.readAllFleetWithUserFilter(request);
        console.log(response);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/getAllFleetDataWithUserFilter :: ', reply.getResponseTime());
    });

    fastify.post('/deleteFleetGroup', async function(request,reply){

        console.log('------------------ delete fleet vessel -------------');
        const response = await fleetController.removeById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/deleteFleetGroup ::', reply.getResponseTime());
    });


};