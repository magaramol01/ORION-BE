'use strict';

const _ = require('lodash');
const {Util} = require("../utils/util");

const MRVMinReportController = require("../controllers/mrvNoonReportController");

module.exports = async function (fastify, opts) {

    fastify.post('/consumeMRVNoonReportData', async function (request, reply) {
        await MRVMinReportController.saveReportData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data received successfully in consumeMRVNoonReportData API !!!"));

        console.log('/consumeMRVNoonReportData :: ', reply.getResponseTime());
    });

    fastify.post('/newConsumeXpressMRVNoonReportData', async function (request, reply) {
        await MRVMinReportController.saveXpressReportData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data Received In newConsumeXpressMRVNoonReportData"));

        console.log('/consumeMRVNoonReportData :: ', reply.getResponseTime());
    });

    fastify.get('/getAndPrepareMRVReportData', async function (request, reply) {
        const response = await MRVMinReportController.getAndPrepareMRVReportData(request.query.vesselId);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAndPrepareMRVReportData :: ', reply.getResponseTime());
    });

 // SSH-53 Voayge Baner
 fastify.get("/getMRVLatestData:vessel", async function (request, reply) {
    const response = await MRVMinReportController.getVoageDetailsForDashboard(
      request
    );
    reply
      .code(200)
      .header("Content-Type", "application/json; charset=utf-8")
      .send(JSON.stringify(response));

    Util.printLog(
      "/getMRVLatestData:vesselId served in : " + reply.getResponseTime()
    );
  });

  fastify.post("/getMRVBnnerDataData", async function (request, reply) {
    const response = await MRVMinReportController.getAllVoyageBannerData(
      request
    );

    reply
      .code(200)
      .header("Content-Type", "application/json; charset=utf-8")
      .send(response);
    console.log("/getMRVBnnerDataData ::", reply.getResponseTime());
  });

  fastify.post("/deleteVBDataById", async function (request, reply) {
    const response = await MRVMinReportController.deleteVoyageNumberById(
      request
    );

    reply
      .code(200)
      .header("Content-Type", "application/json; charset=utf-8")
      .send(response);
    console.log("/deleteVBDataById ::", reply.getResponseTime());
  });

  fastify.post("/createmrvbannerdata", async function (request, reply) {
    const response = await MRVMinReportController.insertMrvBannerData(request);

    reply
      .code(200)
      .header("Content-Type", "application/json; charset=utf-8")
      .send(response);

    console.log("/createmrvbannerdata :: ", reply.getResponseTime());
  });

  fastify.post("/getVBDataById", async function (request, reply) {
    const response = await MRVMinReportController.getById(request);

    reply
      .code(200)
      .header("Content-Type", "application/json; charset=utf-8")
      .send(response);
    console.log("/getVBDataById ::", reply.getResponseTime());
  });

  fastify.post("/upadateVBDataById", async function (request, reply) {
    const response = await MRVMinReportController.updateById(request);

    reply
      .code(200)
      .header("Content-Type", "application/json; charset=utf-8")
      .send(response);
    console.log("/upadateVBDataById ::", reply.getResponseTime());
  });

    fastify.get('/getMRVState:vesselId', async function (request, reply) {
        const response = await MRVMinReportController.getMRVState(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getMRVState:vesselId served in : " + reply.getResponseTime());
    });

  fastify.get('/getMRVStateByDate:vesselId', async function (request, reply) {
      const response = await MRVMinReportController.getMRVStateByDate(request, false);

      reply
          .code(200)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send(JSON.stringify(response));

      Util.printLog("/getMRVStateByDate:vesselId served in : " + reply.getResponseTime());
  });


    fastify.get('/getMRVStateByVoyage:vesselId', async function (request, reply) {
      const response = await MRVMinReportController.getMRVStateByVoyage(request, false);

      reply
          .code(200)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send(JSON.stringify(response));

      Util.printLog("/getMRVStateByVoyage:vesselId served in : " + reply.getResponseTime());
  });

    fastify.get('/getMRVStateByDateAndVoyage:vesselId', async function (request, reply) {
        const response = await MRVMinReportController.getMRVStateByDateAndVoyage(request, false);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getMRVStateByDateAndVoyage:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getMRVCIIStateByDateAndVoyage:vesselId:type', async function (request, reply) {
        const response = await MRVMinReportController.getMRVStateByDateAndVoyage(request, true);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getMRVCIIStateByDateAndVoyage:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getMRVCIIStateByVoyage:vesselId:type', async function (request, reply) {
        const response = await MRVMinReportController.getMRVStateByVoyage(request, true);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getMRVCIIStateByVoyage:vesselId:type served in : " + reply.getResponseTime());
    });

    fastify.get('/getMRVCIIStateByDate:vesselId', async function (request, reply) {
        const response = await MRVMinReportController.getMRVStateByDate(request, true);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getMRVCIIStateByDate:vesselId served in : " + reply.getResponseTime());
    });

    fastify.post('/insertMRVDataInEOOICII', async function (request, reply) {
        MRVMinReportController.saveDataInCIIEOOITabel3(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("mrv noon data insert successfully in CII & Avg Tabel !!!"));

        console.log('/insertMRVDataInEOOICII :: ', reply.getResponseTime());
    });

    fastify.get('/getCIILast90DaysData:vesselId:type', async function (request, reply) {

        const response = await MRVMinReportController.getCIIGraphofAllVoyageLast90Days(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/getCIILast90DaysData :: ', reply.getResponseTime());
    });

};
