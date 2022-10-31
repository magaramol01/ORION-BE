'use strict';
const shipRouteController = require("../controllers/shipRouteController");

module.exports = async function (fastify, opts) {


    fastify.post('/saveShipRoute', async function (request,reply){

        const response = await shipRouteController.saveShipRoute(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/createShip :: ', reply.getResponseTime());
    });


    fastify.post('/updateShipRoute', async function (request,reply){

        const response = await shipRouteController.updateShipRoute(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/createShip :: ', reply.getResponseTime());
    });

    fastify.post('/getShipRoute', async function (request,reply){

        const response = await shipRouteController.getShipRoute(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/createShip :: ', reply.getResponseTime());
    });



 fastify.post('/updatedRouteHistoryData', async function (request,reply){

   const response = await shipRouteController.updateShipRouteData(request);

   reply
    .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
       .send(response);
      console.log(response)
   console.log('/createShip :: ', reply.getResponseTime());
 });

    fastify.post('/insertRedPoint', async function (request,reply){

        const response = await shipRouteController.insertRedPointData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/createShip :: ', reply.getResponseTime());
    });
}
