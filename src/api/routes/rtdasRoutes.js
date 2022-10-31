'use strict';
const rtdasController = require("../controllers/rtdasController");
const rtdasModel = require("../models/rtdasModel");
const DataAccessAdapter = require('../adaptors/dataAccessAdaptorSingleton');
const UnitsModel = require("../models/unitsModel");
const MachineModel = require("../models/machineModel");
const {Util} = require("../utils/util");
const multer = require('fastify-multer');
const upload = multer({ dest: 'uploads/' });
const _ = require('lodash');
const csv=require('csvtojson');
const RTDASController = new rtdasController();

module.exports = async function (fastify, opts) {

    fastify.post('/saveRTDASRegistration', async function (request, reply) {
        const RTDASController = new rtdasController();
        const response = await RTDASController.saveRTDASRegistration(request, reply);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createCause :: ', reply.getResponseTime());
    });

    fastify.get('/getAllRTDASMapping', async function (request, reply) {
        const RTDASController = new rtdasController();
        // RTDASController.getAllRTDASMapping(request,reply);
        let response = {"data": await RTDASController.getAllRTDASMappingInJson(request), "error": ""};
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log(reply.getResponseTime());
        console.log("getAllRTDASMapping");
    });

    fastify.get('/getAllRTDASMappingAndUnits', async function (request, reply) {
        const RTDASController = new rtdasController();
        // RTDASController.getAllRTDASMapping(request,reply);
        let response = {
            "rtds": await RTDASController.getAllRTDASMappingInJson(request),
            "units": UnitsModel.getUnitsJsonData(),
            "machines": await MachineModel.getMachinesJsonData(),
            "scalings": await RTDASController.getScalingData(request),
            "error": ""
        };
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        Util.printRequestServeTime(reply);
        console.log("getAllRTDASMappingAndUnits");
    });

    fastify.get('/getAllRTDASRegistration', async function (request, reply) {
        const RTDASController = new rtdasController();
        const rtdasRegistrationData = await rtdasModel.getRTDASRegistrationJsonData();
        let response = {"data": rtdasRegistrationData, "error": ""};
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        Util.printRequestServeTime(reply);
        console.log("getAllRTDASRegistration");
    });

    fastify.post('/updateRTDASRegistration', async function (request, reply) {
        const RTDASController = new rtdasController();
        const response = RTDASController.updateRTDASRegistration(request, reply);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send("update successfully");
    });

    fastify.post('/createRTDASRegistrationForJsonFile', {preHandler : upload.single('file')},async function (req, reply) {
        let jsonName;
        let jsonDesc;
        let fileName;
        let rtrtdasId = "";
        let data = '';
        let userId;
        let ip;
        const RTDASController = new rtdasController();
        // let id = RTDASController.createRTDASRegistration(request,reply);
        if (!req.isMultipart()) { // you can use this decorator instead of checking headers
            reply.code(400).send(new Error('Request is not multipart'))
            return
        }

        jsonName = req.body.jsonName;
        jsonDesc = req.body.jsonDescription;
        fileName = req.file.originalname;
        userId = req.session.user.id;
        ip = req.ip
        let shipName = req.session.user.selectedShipName;
        if(req.body.rtdasId){
            rtrtdasId = req.body.rtdasId;
        }
        const converter=csv({
            colParser : {
                "TagName" : "string",
                "ParameterName" : "string",
                "Description" : "string",
                "Unit" : "string",
                "ScalingValue" : "number",
                "VesselName" : "string",
                "MachineName" : "string",
                "NormalRange" : "string",
                "SpecifiedRange" : "string"
            }
        })
            .fromFile(req.file.path)
            .then(async (json)=>{
                let res, headers = [];

                const expectedHeaderFormat = [
                    "TagName", "ParameterName", "Description", "Unit", "ScalingValue",
                    "VesselName", "MachineName", "NormalRange", "SpecifiedRange"
                ];

                if(json && json.length >= 1) {
                    headers = Object.keys(json[0]);
                    if (headers.length === expectedHeaderFormat.length &&
                        expectedHeaderFormat.every(r => headers.includes(r))) {
                        res = await RTDASController.saveJsonFileDataOfRTDAS(json, jsonName, jsonDesc,fileName, rtrtdasId,userId,shipName,ip,req);;
                    } else { res = "Invalid CSV Header Format"; }
                } else { res = "Empty CSV File"; }

                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(res);
            })
        // const mp = req.multipart(handler, onEnd)
        //
        // mp.on('field', function (key, value) {
        //     if (key === "jsonDescription") {
        //         jsonDesc = value;
        //     }
        //     if (key === "jsonName") {
        //         jsonName = value;
        //     }
        //     if (key === "rtdasId") {
        //         rtrtdasId = value;
        //     }
        // })
        //
        // function onEnd(err) {
        //     if (err) {
        //         reply.send(err)
        //         return
        //     }
        //     let id = RTDASController.saveJsonFileDataOfRTDAS(JSON.parse(data), jsonName, jsonDesc, fileName, rtrtdasId)
        //     reply
        //         .code(200)
        //         .header('Content-Type', 'application/json; charset=utf-8')
        //         .send(JSON.stringify(id));
        // }
        //
        // console.log("createRTDASRegistrationForJsonFile");
        //
        // async function handler(field, file, filename, encoding, mimetype) {
        //     var readerStream = file;
        //     fileName = filename;
        //     readerStream.setEncoding('UTF8');
        //     readerStream.on('data', function (chunk) {
        //         data += chunk;
        //     });
        //
        //     readerStream.on('end', function () {
        //     });
        //
        //     readerStream.on('error', function (err) {
        //         console.log(err.stack);
        //     });
        // }
    });

    fastify.post('/orion_consumeRTDASData', async function (request, reply) {
        RTDASController.consumeRTDASMappingFromJson(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data received successfully"));

        console.log("/consumeRTDASMappingFromJson : " + reply.getResponseTime());
    });

    fastify.post('/uploadcsvForRuleChain', {preHandler : upload.single('file')},async function (req, reply) {
        if (!req.isMultipart()) {
            reply.code(400).send(new Error('Request is not multipart'))
            return
        }

        const converter=csv({
            colParser : {
                "ParameterName" : "string",
                "Condition" : "string",
                "Threshold" : "string",
                "RuleName" : "string",
                "RuleDescription" : "string",
                "Message" : "string",
                "MachineName" : "string",
                "Periodicity" : "number",
                "Periodunit" : "string",
                "VesselName" : "string",
                "NoOfOccurrencesIsChecked" : "string",
                "NoOfOccurrencesValue" : "number",
                "isEvaluationFactorChecked" : "string",
                "isEvaluationFactorType" : "string",
                "isEvaluationFactorValue" : "number",
                "isAlarm" : "string"
            }
        })
            .fromFile(req.file.path)
            .then(async (json)=>{
                const RTDASController = new rtdasController();
                let res, headers = [];

                const expectedHeaderFormat = [
                    "ParameterName", "Condition", "Threshold", "RuleName", "RuleDescription",
                    "Message", "MachineName", "Periodicity", "Periodunit", "VesselName",
                    "NoOfOccurrencesIsChecked", "NoOfOccurrencesValue", "isEvaluationFactorChecked" , "isEvaluationFactorType", "isEvaluationFactorValue",
                    "isAlarm"
                ];

                if(json && json.length >= 1) {
                    headers = Object.keys(json[0]);
                    if (headers.length === expectedHeaderFormat.length &&
                        expectedHeaderFormat.every(r => headers.includes(r))) {
                        res = await RTDASController.createRuleChain(req,json);
                    } else { res = "Invalid CSV Header Format"; }
                } else { res = "Empty CSV File"; }

                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(res);
            })
    });

};

