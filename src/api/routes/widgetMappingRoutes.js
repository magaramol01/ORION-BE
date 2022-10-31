'use strict';
const widgetMappingController = require("../controllers/widgetMappingController");
const multer = require('fastify-multer');
const upload = multer({ dest: 'uploads/' });
const csv=require('csvtojson');

module.exports = async function (fastify, opts) {

    fastify.post('/uploadcsvForWidget', {preHandler : upload.single('file')},async function (req, reply) {
        let fileName;
        let userId;
        let ip;
        if (!req.isMultipart()) {
            reply.code(400).send(new Error('Request is not multipart'))
            return
        }
        fileName = req.file.originalname;
        userId = req.session.user.id;
        ip = req.ip
        const converter=csv({
            colParser : {
                "widgetId" : "string",
                "value" : "string",
                "caption" : "string",
                "unit" : "string",
                "vesselName" : "string",
                "precision" : "number",
                "startValue" : "number",
                "endValue" : "number",
                "minValue" : "number",
                "maxValue" : "number",
                "lowerBoundValue" : "number",
                "upperBoundValue" : "number",
                "hideMinValue" : "number",
                "hideMaxValue" : "number",
                "digitalData":{}
            }
        })
            .fromFile(req.file.path)
            .then(async (json)=>{
                let res, headers = [];

                const expectedHeaderFormat = [
                    "widgetId", "value", "caption", "unit",
                    "vesselName", "precision", "startValue",
                    "endValue", "minValue", "maxValue",
                    "lowerBoundValue", "upperBoundValue",
                    "hideMinValue", "hideMaxValue","digitalData"
                ];

                if(json && json.length >= 1) {
                    headers = Object.keys(json[0]);
                    if (headers.length === expectedHeaderFormat.length &&
                        expectedHeaderFormat.every(r => headers.includes(r))) {
                        res = await widgetMappingController.saveWidgetCsvFile(json,fileName,userId,ip);
                    } else { res = "Invalid CSV Header Format"; }
                } else { res = "Empty CSV File"; }

                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(res);
            })
    });

    fastify.get('/getLastWidgetFile', async function (request, reply) {
        const response = await widgetMappingController.getLastUpdatedCsvFile(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/getAllWidgetsParameters :: ', reply.getResponseTime());
    });

    fastify.get('/downloadcsv', async function (request, reply) {
        const response = await widgetMappingController.downloadcsvFile(request,reply);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/getAllWidgetsParameters :: ', reply.getResponseTime());
    });

};

