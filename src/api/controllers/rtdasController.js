'use strict';

/*
* CRUD CONTROLLER
* */

const appSettingsModel = require('../models/appSettingsModel');

const dateFormat = require('dateformat');
const EmailScheduler = require("../mappers/scheduleEmail");
const _ = require('lodash');

const RuleExecutionSingletonController = require("../controllers/ruleExecutionSingletonController");
const WidgetsParametersController = require("./widgetsParametersController");
const FleetDashboardController = require("./fleetDashboardController");
const RealTimeDataController = require("./realTimeDataController");
const ParametersController = require("./parametersController");
const parameterModel = require("../models/parametersModel");
const FailureAdvisoriesModel = require("../models/failureAdvisoriesModel");
const failureAdvisoriesController = require("./failureAdvisoriesController");
const causesModel = require("../models/causesModel");
const causesController = require("./causesController");
const RuleConfigsModel = require("../models/ruleConfigsModel");
const RuleConfogController = require("./ruleConfigController");
const RuleBlocksModel = require("../models/ruleBlocksModel");
const ruleBlocksController = require("./ruleBlocksController");
const outcomesController = require("./outcomesController");
const RealTimeParameterDataHolder = require("../mappers/realTimeParameterDataHolder");
const {getRTDASRegistrationJsonData, getRTDASRegistrationJsonDataFilePath, insertRtdasData, updateRtdasData} = require('../models/rtdasModel');
const AudiTrailModel = require("../models/auditTrailModel");
const ShipModel = require("../models/shipModel");
const ruleCsvModal = require("../models/ruleCsvModal");
const parameterCsvModal = require("../models/parameterCsvModal");
const DataAccessAdapterSingleton = require('../adaptors/dataAccessAdaptorSingleton');
const RTDASPacketDataHolderSingleton = require("../mappers/rtdasPacketDataHolder");
const {processAndSendDataOnKafka} = require("../../kafka/producer");
const {Util} = require("../utils/util");

let NMEAControllerSingleton;

var staticvar = 0;

let that;
let RTDASId;
let startRecordMappingDatetime;
let timeToRecord;

class rtdasController {

    constructor() {
        that = this;
        this.dataAccessAdapterSingleton = DataAccessAdapterSingleton.getInstance();
    }

    async saveRTDASRegistration(request, reply) {
        //const dataAccessAdaptor = new DataAccessAdapter();

        if (request.body.type === "DB") {
            // let dataFromFrontEnd = request.body.dbObject;
            //
            // let RTDASName = dataFromFrontEnd.rtdas_name;
            // let description = dataFromFrontEnd.description;
            // let databaseType = dataFromFrontEnd.db_type;
            // let dataBaseName = dataFromFrontEnd.db_name;
            // let host = dataFromFrontEnd.host;
            // let port = dataFromFrontEnd.port;
            // let user = dataFromFrontEnd.user_name;
            // let password = dataFromFrontEnd.password;
            // let tableNameArr = dataFromFrontEnd.table_name;
            // let response = {};
            // response["data"] = "";
            // response["error"] = "";
            // let paramsArr = [];
            // dataAccessAdaptor.createConnection(host, port, user, password, dataBaseName, true)
            // dataAccessAdaptor.connection.connect(function (err) {
            //     if (err) {
            //         reply
            //             .code(200)
            //             .header('Content-Type', 'application/json; charset=utf-8')
            //             .send(response);
            //         console.log(reply.getResponseTime());
            //     }
            //     let tableData = [];
            //     for (let indexOfTable in tableNameArr) {
            //         let tableName = tableNameArr[indexOfTable]["value"];
            //
            //         let queryFroColumns = "SHOW COLUMNS FROM " + tableName;
            //         dataAccessAdaptor.connection.query(queryFroColumns, paramsArr, (error, results, fields) => {
            //             if (error) {
            //                 response["error"] = error.message;
            //                 reply
            //                     .code(200)
            //                     .header('Content-Type', 'application/json; charset=utf-8')
            //                     .send(JSON.stringify(response));
            //                 console.log(reply.getResponseTime());
            //                 return console.error(error.message);
            //             }
            //             let columnNames = [];
            //             if (results.length !== 0) {
            //                 for (let item in results) {
            //                     columnNames.push(results[item]["Field"]);
            //                 }
            //             }
            //             let tableDataObj = {
            //                 "tableName": tableName,
            //                 "columnNames": columnNames
            //             }
            //             tableData.push(tableDataObj);
            //             if (tableData.length === tableNameArr.length) {
            //                 let data = {
            //                     type: "DB",
            //                     dbObject: {
            //                         rtdas_name: RTDASName,
            //                         description: description,
            //                         db_type: databaseType,
            //                         db_name: dataBaseName,
            //                         host: host,
            //                         port: port,
            //                         user_name: user,
            //                         password: password,
            //                         table_name: tableNameArr,
            //                         dateTime: Util.getCurrentDateTime(),
            //                         column_names: tableData
            //                     }
            //                 }
            //                 that.saveRTDASOfTableToJson(tableNameArr, tableData, data, reply, response)
            //             }
            //         });
            //     }
            // });
            //
            // const auditTrailInfo = Util.getAuditTrailInfo("create", "RTDAS Mapping", "DB");
            // AudiTrailModel.saveAuditTrail({
            //     userId: request.query.userId,
            //     ipAddress: request.ip,
            //     action: auditTrailInfo.actionMsg,
            //     description: auditTrailInfo.descMsg
            // });
        }
        else if (request.body.type === "JSON" && request.body.jsonObject.type === "STREAM") {
            let jsonObject = request.body;

            jsonObject["jsonObject"]["streamObject"]["dateTime"] = Util.getCurrentDateTime();
            jsonObject["jsonObject"]["isMappingStored"] = false;
            jsonObject["jsonObject"]["streamObject"]["dateTimeOfMappingStarted"] = "";

            const rtdasRegsJSONData = await getRTDASRegistrationJsonData();
            const newId = "RTDAS" + (Object.keys(rtdasRegsJSONData).length + 1);
            const type = jsonObject.jsonObject.type;
            let objectvalue = null;
            let userId = request.session.user.id;
            let ShipName = request.session.user.selectedShipName;

            if (type == "STREAM") {
                objectvalue = JSON.stringify(jsonObject.jsonObject.streamObject);
            } else {
                objectvalue = JSON.stringify(jsonObject.jsonObject.fileObject);
            }

            const result = await insertRtdasData(newId, type, objectvalue,userId,ShipName);

            if (result.inserted > 0) {
                //const RtdasRegistrationKey = result.generated_keys[0];
                jsonObject['userId']=userId;
                jsonObject['ShipName']=ShipName;
                rtdasRegsJSONData[newId] = jsonObject;
                return newId;
                console.log("data insered");
            } else {
                return "Error occurred while creating a Cause!!!";
            }

            RTDASId = newId;
            timeToRecord = jsonObject.jsonObject.streamObject.fetchRecordsinMilliseconds;
            startRecordMappingDatetime = Util.getCurrentDateTime();

            const auditTrailInfo = Util.getAuditTrailInfo("create", "RTDAS Mapping", "JSON");
            AudiTrailModel.saveAuditTrail({
                userId: request.session.user.id,
                ipAddress: request.ip,
                action: auditTrailInfo.actionMsg,
                description: auditTrailInfo.descMsg
            });

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(newId);
            console.log(reply.getResponseTime());
        }
    }

    getAllRTDASMapping(request, reply) {
        let paramsArr = [];
        let response = {};
        response["data"] = "";
        response["error"] = "";

        let query = "select * from RTDAS_REG";

        this.dataAccessAdapterSingleton.connection.query(query, paramsArr, (error, results, fields) => {
            if (error) {
                response["error"] = error.message;
                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(response);
                console.log(reply.getResponseTime());
            }

            let rtdasList = [];
            if (results.length !== 0) {
                for (let item in results) {
                    let arr = results[item]["column_names"].split(",");
                    for (let subItem in arr) {
                        rtdasList.push(results[item]["rtdas_name"] + ":" + results[item]["table_name"] + ":" + arr[subItem])
                    }
                }
            }

            rtdasList = [...this.getAllRTDASMappingInJson(request)];
            response["data"] = rtdasList;

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(response);

            console.log(reply.getResponseTime());
        });
    };

    getAllRTDASRegistration(request, reply) {
        let paramsArr = [];
        let response = {};
        response["data"] = "";
        response["error"] = "";

        let query = "select * from RTDAS_REG";

        this.dataAccessAdapterSingleton.connection.query(query, paramsArr, (error, results, fields) => {
            if (error) {
                response["error"] = error.message;
                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(response);
                console.log(reply.getResponseTime());
            }

            let rtdasList = [];
            if (results.length !== 0) {
                for (let item in results) {
                    let data = {};
                    data = results[item];
                    data["table_name"] = Array(data["table_name"]);

                    rtdasList.push(data)
                }
            }

            response["data"] = rtdasList;

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(response);

            console.log(reply.getResponseTime());
        });
    };

    async updateRTDASRegistration(request, reply) {
        //const dataAccessAdaptor = new DataAccessAdapter();
        let data = request.body;
        let RTDASId = Object.keys(data)[0];
        let dataFromFrontEnd = Object.values(data)[0];

        if (dataFromFrontEnd.type === "DB") {
            // dataFromFrontEnd = dataFromFrontEnd.dbObject;
            // let RTDASName = dataFromFrontEnd.rtdas_name;
            // let description = dataFromFrontEnd.description;
            // let databaseType = dataFromFrontEnd.db_type;
            // let dataBaseName = dataFromFrontEnd.db_name;
            // let host = dataFromFrontEnd.host;
            // let port = dataFromFrontEnd.port;
            // let user = dataFromFrontEnd.user_name;
            // let password = dataFromFrontEnd.password;
            // let tableNameArr = dataFromFrontEnd.table_name;
            // let response = {};
            // response["data"] = "";
            // response["error"] = "";
            // let paramsArr = [];
            // dataAccessAdaptor.createConnection(host, port, user, password, dataBaseName, true)
            // dataAccessAdaptor.connection.connect(function (err) {
            //     if (err) {
            //         reply
            //             .code(200)
            //             .header('Content-Type', 'application/json; charset=utf-8')
            //             .send(response);
            //         console.log(reply.getResponseTime());
            //     }
            //     let tableData = [];
            //     for (let indexOfTable in tableNameArr) {
            //         let tableName = tableNameArr[indexOfTable]["value"];
            //
            //         let queryFroColumns = "SHOW COLUMNS FROM " + tableName;
            //         dataAccessAdaptor.connection.query(queryFroColumns, paramsArr, (error, results, fields) => {
            //             if (error) {
            //                 response["error"] = error.message;
            //                 reply
            //                     .code(200)
            //                     .header('Content-Type', 'application/json; charset=utf-8')
            //                     .send(JSON.stringify(response));
            //                 console.log(reply.getResponseTime());
            //                 return console.error(error.message);
            //             }
            //             let columnNames = [];
            //             if (results.length !== 0) {
            //                 for (let item in results) {
            //                     columnNames.push(results[item]["Field"]);
            //                 }
            //             }
            //             let tableDataObj = {
            //                 "tableName": tableName,
            //                 "columnNames": columnNames
            //             }
            //             tableData.push(tableDataObj);
            //             if (tableData.length === tableNameArr.length) {
            //                 let data = {
            //                     type: "DB",
            //                     dbObject: {
            //                         rtdas_name: RTDASName,
            //                         description: description,
            //                         db_type: databaseType,
            //                         db_name: dataBaseName,
            //                         host: host,
            //                         port: port,
            //                         user_name: user,
            //                         password: password,
            //                         table_name: tableNameArr,
            //                         dateTime: Util.getCurrentDateTime(),
            //                         column_names: tableData
            //                     }
            //                 }
            //                 that.updateRTDASOfTableToJson(tableNameArr, tableData, data, reply, response, RTDASId)
            //             }
            //         });
            //     }
            // });
        }
        else if (dataFromFrontEnd.type === "JSON" && dataFromFrontEnd.jsonObject.type === "STREAM") {
            let jsonObject = dataFromFrontEnd;
            jsonObject["jsonObject"]["streamObject"]["dateTime"] = Util.getCurrentDateTime();
            jsonObject["jsonObject"]["isMappingStored"] = false;
            jsonObject["jsonObject"]["streamObject"]["dateTimeOfMappingStarted"] = 0;

            const type = jsonObject.jsonObject.type;
            let objectvalue = null;

            if (type == "STREAM") {
                objectvalue = JSON.stringify(jsonObject.jsonObject.streamObject);
            } else {
                objectvalue = JSON.stringify(jsonObject.jsonObject.fileObject);
            }

            let userId = request.session.user.id;
            let ShipName = request.session.user.selectedShipName;
            const result = await updateRtdasData(RTDASId, type, objectvalue,userId,ShipName);

            if (result.replaced > 0) {
                const rtdasRegsJSONData = await getRTDASRegistrationJsonData();
                Object.values(data)[0]['userId']=userId;
                Object.values(data)[0]['ShipName']=ShipName;
                rtdasRegsJSONData[Object.keys(data)[0]] = Object.values(data)[0];
                return "rtdas update successfully!!!";
            } else {
                return "Error occurred while updating a rtdas!!!";
            }

            // RTDASId = RTDASId;
            // timeToRecord = jsonObject.streamObject.fetchRecordsinMilliseconds;
            // isMappingStored = false;
            // startRecordMappingDatetime = Util.getCurrentDateTime();

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send("Update Successfully");

            console.log(reply.getResponseTime());
        }
    };

    createRTDASRegistration(request, reply) {
        let data = request.body;

        if (data.type === "JSON") {
            if (data.jsonObject.type === "FILE") {
                data.jsonObject.fileObject.jsonFile.data = Util.getArrFromJsonForRTDAS(data.jsonObject.fileObject.jsonFile.data);
                const rtdasRegsJSONData = getRTDASRegistrationJsonData();
                const newId = "RTDAS" + (Object.keys(rtdasRegsJSONData).length + 1);
                rtdasRegsJSONData[newId] = data;
                Util.writeJsonFile(getRTDASRegistrationJsonDataFilePath(), rtdasRegsJSONData);
                return newId;
            } else if (data.jsonObject.type === "STREAM") {

            }

        } else if (data.type === "DB") {

        }
    };

    async saveJsonFileDataOfRTDAS(data, name, desc, fileName, rtdasId,userId,shipName,ip,req) {

        let validationError = null;
        let specifiedRangeRegex = new RegExp("^[0-9]*(\\.[0-9]+)?(\\|)?\\-?([0-9])+(\\.[0-9]+)?$");

        for (let [i,row] of data.entries()) {
            switch (true) {
                case !row.TagName:
                    validationError = "Invalid Tag Name Name at " + ( i + 2 ) + " Row";
                    break;
                case !row.ParameterName:
                    validationError = "Invalid Parameter name at " + ( i + 2 ) + " Row";
                    break;
                case !row.Description:
                    validationError = "Invalid Description at " + ( i + 2 ) + " Row";
                    break;
                // case !row.Unit:
                //     validationError = "Invalid Unit Value at " + ( i + 2 ) + " Row";
                //     break;
                case row.ScalingValue && typeof row.ScalingValue !== "number":
                    validationError = "Invalid Scaling Value at " + ( i + 2 ) + " Row";
                    break;
                case !row.VesselName:
                    validationError = "Invalid Vessel Name at " + ( i + 2 ) + " Row";
                    break;
                case !row.MachineName:
                    validationError = "Invalid Machine Name Value at " + ( i + 2 ) + " Row";
                    break;
                case row.NormalRange && !specifiedRangeRegex.test(row.NormalRange):
                    validationError = "Invalid Normal Range at " + ( i + 2 ) + " Row";
                    break;
                case row.SpecifiedRange && !specifiedRangeRegex.test(row.SpecifiedRange):
                    validationError = "Invalid Specified Range at " + ( i + 2 ) + " Row";
                    break;
            }

            if(validationError)
                return validationError;
        }

        //let uniqueData = Util.getArrFromJsonForRTDAS(data);
        let countCreatedParameter = 0;
        let countUpdatedParameter = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i]['ScalingValue'] === "") {
                data[i]['ScalingValue'] = "1";
            }
        }
        let jsonForParameter = {name: "", description: "", unit: "", machine: "", precision: "", isRealValue: true, isFixedValue: false, isCalculatedValue: false, rtdasMapping: "", specifiedRange: {isSpecifiedRange: false, isRange: true, range: {from: "", to: ""}, isSingleValue: false, singleValue: {value: ""}, isCalculatedExpression: false, calculatedExpression: {expression: "", expressionDetails: ""}}, normalRange: {isNormalRange: false, isRange: true, range: {from: "", to: ""}, isSingleValue: false, singleValue: {value: ""}, isCalculatedExpression: false, calculatedExpression: {expression: "", expressionDetails: ""}}, enumeratedValue: {isEnumeratedValue: false, values: []}, scale: "", vesselName: ""}
        for (let i = 0; i < data.length; i++) {
            console.log("parameter file index ::" +i);
            let jsonForParameterCopy = _.cloneDeep(jsonForParameter);
            if(data[i].ParameterName === ""){
                data[i].ParameterName = data[i].TagName;
            }
            jsonForParameterCopy["name"] = data[i].ParameterName;
            jsonForParameterCopy["description"] = data[i].Description;
            jsonForParameterCopy["unit"] = data[i].Unit;
            jsonForParameterCopy["machine"] = data[i].MachineName;
            jsonForParameterCopy["rtdasMapping"] = data[i].TagName;
            jsonForParameterCopy["scale"] = data[i].ScalingValue;
            jsonForParameterCopy["vesselName"] = data[i].VesselName;

            if(data[i].NormalRange !== "") {
                jsonForParameterCopy["normalRange"]["isNormalRange"] = true;
                if(data[i].NormalRange.indexOf("|") > 0) {
                    jsonForParameterCopy["normalRange"]["isRange"] = true;
                    let valueArray = data[i].NormalRange.split("|");
                    jsonForParameterCopy["normalRange"]["range"].from = valueArray[0];
                    jsonForParameterCopy["normalRange"]["range"].to = valueArray[1];
                } else {
                    jsonForParameterCopy["normalRange"]["isRange"] = false;
                    jsonForParameterCopy["normalRange"]["isSingleValue"] = true;
                    jsonForParameterCopy["normalRange"]["singleValue"]["value"] = data[i].NormalRange;
                }
            }
            if(data[i].SpecifiedRange !== "") {
                jsonForParameterCopy["specifiedRange"]["isSpecifiedRange"] = true;
                if(data[i].SpecifiedRange.indexOf("|") > 0) {
                    jsonForParameterCopy["specifiedRange"]["isRange"] = true;
                    let valueArray = data[i].SpecifiedRange.split("|");
                    jsonForParameterCopy["specifiedRange"]["range"].from = valueArray[0];
                    jsonForParameterCopy["specifiedRange"]["range"].to = valueArray[1];
                } else {
                    jsonForParameterCopy["specifiedRange"]["isRange"] = false;
                    jsonForParameterCopy["specifiedRange"]["isSingleValue"] = true;
                    jsonForParameterCopy["specifiedRange"]["singleValue"]["value"] = data[i].SpecifiedRange;
                }
            }

            let vesselId = ShipModel.getShipIdByMappingName(data[i].VesselName);
            let parameterId = await ParametersController.checkStatusOfParameterCreation(data[i].ParameterName, vesselId);
            if(parameterId !== "") {
                let jsonForParameterCopyUpdate = {};
                jsonForParameterCopyUpdate[parameterId] = jsonForParameterCopy;
                req.body = jsonForParameterCopyUpdate;
                let parameterKey = await ParametersController.update(req);
                if(parameterKey === "Error occurred while updating a Parameter!!!"){
                }else{
                    ++countUpdatedParameter
                }
            } else {
                req.body = jsonForParameterCopy;
                let parameterKey = await ParametersController.create(req);
                if(parameterKey === "Error occurred while creating a Parameter!!!"){
                }else{
                    ++countCreatedParameter;
                }
            }
        }

        const allData = JSON.stringify(data);
        const vesselName = data[0].VesselName;
        const vesselId = ShipModel.getShipIdByMappingName(vesselName);
        const dateTime = Util.getNewDate();
        const formattedDateTime = dateFormat(dateTime, Util.getCommonDateFormat());
        const result = await parameterCsvModal.saveParameterCsvData(fileName,allData,vesselId,userId,formattedDateTime);

        const auditTrailInfo = Util.getAuditTrailInfo("upload",  "Scaling CSV", fileName);
        AudiTrailModel.saveAuditTrail({
            userId: userId,
            ipAddress: ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        return countCreatedParameter+" new parameter created and "+countUpdatedParameter+" parameters updated";
    };

    async getAllRTDASMappingInJson(request) {
        let rtdasData = await getRTDASRegistrationJsonData();
        let rtdasMapping = [];
        for (let rtdas in rtdasData) {
            if (rtdasData[rtdas].type === "JSON") {
                if (rtdasData[rtdas].jsonObject.type === "FILE") {

                    //rtdasMapping = [...Util.combineRTDASWithRTDASName(rtdasData[rtdas].jsonObject.fileObject.jsonName, rtdasData[rtdas].jsonObject.fileObject.jsonFile.data)];
                    rtdasMapping = [...Util.combineRTDASWithCSVName(rtdasData[rtdas].jsonObject.fileObject.jsonFile.data)];
                }
            }
            if (rtdasData[rtdas].type === "JSON") {
                if (rtdasData[rtdas].jsonObject.type === "STREAM") {
                    if(rtdasData[rtdas].jsonObject.streamObject.data!=undefined){
                        if(rtdasData[rtdas].jsonObject.streamObject.data.length!=0){
                            rtdasMapping = [...Util.combineRTDASWithRTDASName(rtdasData[rtdas].jsonObject.streamObject.jsonName, rtdasDataCopy[rtdas].jsonObject.streamObject.data)];
                        }
                    }
                }
            }
            // if (rtdasData[rtdas].type === "DB") {
            //     let tableRTDAS = [];
            //     for (let table in rtdasData[rtdas].dbObject.column_names) {
            //         let temp = rtdasData[rtdas].dbObject.column_names[table];
            //         tableRTDAS = [...tableRTDAS, ...Util.combineRTDASWithRTDASName(temp.tableName, temp.columnNames)]
            //     }
            //     rtdasMapping = [...rtdasMapping, ...Util.combineRTDASWithRTDASName(rtdasData[rtdas].dbObject.rtdas_name, tableRTDAS)]
            // }
        }
        return rtdasMapping;
    };

    async getScalingData(request) {
        let rtdasData = await getRTDASRegistrationJsonData();
        let rtdasMapping = [];
        for (let rtdas in rtdasData) {
            if (rtdasData[rtdas].type === "JSON") {
                if (rtdasData[rtdas].jsonObject.type === "FILE") {
                    rtdasMapping = [...Util.combineScalingWithCSVName(rtdasData[rtdas].jsonObject.fileObject.jsonFile.data)];
                }
            }
        }
        return rtdasMapping
    }

    async saveRTDASOfTableToJson(tableNameArr, tableData, data, reply, response) {
        if (tableNameArr.length === tableData.length) {

            const rtdasRegsJSONData = getRTDASRegistrationJsonData();
            const newId = "RTDAS" + (Object.keys(rtdasRegsJSONData).length + 1);
            const type = data.type;
            const objectvalue = JSON.stringify(data.dbObject);
            const result = await insertRtdasData(newId, type, objectvalue);
            if (result.inserted > 0) {
                return "rtdas created successfully!!!";
            } else {
                return "Error occurred while creating a rtdas!!!";
            }
            response["data"] = newId;
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(response);
            console.log(reply.getResponseTime());
            console.log("saveRTDASRegistration");
        }
    };

    async updateRTDASOfTableToJson(tableNameArr, tableData, data, reply, response, id) {
        if (tableNameArr.length === tableData.length) {

            const type = data.type;
            const objectvalue = JSON.stringify(data.dbObject);
            const result = await updateRtdasData(id, type, objectvalue);
            if (result.replaced > 0) {
                return "Cause created successfully!!!";
            } else {
                return "Error occurred while creating a Cause!!!";
            }

            response["data"] = "Update Successfully";
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(response);
            console.log(reply.getResponseTime());
            console.log("updateRTDASRegistration");
        }
    };

    async consumeRTDASMappingFromJson(request) {
        const requestData = request.body;
        const vn = Object.keys(requestData)[0];
        if(Object.keys(requestData[vn]["AlertData"][0]).length==1) {
            console.log("only Timestamp Received.")
            return;
        }
        let tempData = requestData[vn]["AlertData"][0];
        if( tempData.hasOwnProperty("AIVDO_Latitude") && tempData.hasOwnProperty("AIVDO_Longitude") ) {
            if(tempData["AIVDO_Latitude"] < 0) {
                tempData["AIVDO_Latitude_Direction"] = "S";
                tempData["AIVDO_Latitude"] = -1 * tempData["AIVDO_Latitude"];
            } else {
                tempData["AIVDO_Latitude_Direction"] = "N";
            }
            if(tempData["AIVDO_Longitude"] < 0) {
                tempData["AIVDO_Longitude_Direction"] = "W";
                tempData["AIVDO_Longitude"] = -1 * tempData["AIVDO_Longitude"];
            } else {
                tempData["AIVDO_Longitude_Direction"] = "E";
            }
        }
        requestData[vn]["AlertData"][0] = tempData;

        if (appSettingsModel.getAppSettingsJsonData().isRequireDetailLogs) {
            Util.printLog("Data received in consumeRTDASMappingFromJson is :: " + JSON.stringify(requestData));
        } else {
            Util.printLog("Data received in consumeRTDASMappingFromJson");
        }

        const incomingDataShipName = Object.keys(requestData)[0];
        let incomingDataShipNameIdentifier = Util.getVesselIdentifier(incomingDataShipName);
        const incomingDataVesselId = ShipModel.getShipIdByMappingName(incomingDataShipNameIdentifier);

        // if any vessel is not registered then we will ignore its data
        // added for security reason and it will ignore redundant data
        if (!incomingDataVesselId) {
            return;
        }

        let dataReceiveTimestamp = Util.getNewDate();
        console.log("Email Scheduler Date is :: ", dateFormat(dataReceiveTimestamp, Util.getCommonDateFormat()));
        EmailScheduler.getInstance().validateAndSetEmailSchedulerData(incomingDataVesselId, dataReceiveTimestamp);

        const ruleExecutionSingletonController = RuleExecutionSingletonController.getInstance();
        const vesselInstanceByVesselName = ruleExecutionSingletonController.getVesselInstanceByVesselId(incomingDataVesselId);

        const alertData = requestData[incomingDataShipName]["AlertData"];

        const RTDASPacketDataHolder = RTDASPacketDataHolderSingleton.getInstance();
        RTDASPacketDataHolder.processAndSetDataInHolder(alertData, incomingDataVesselId);

        const combinedRTDASPacketData = RTDASPacketDataHolder.getVesselAllPacketData(incomingDataVesselId);
        const combinedRTDASPacketDataJson = Util.convertMapToJsonObj(combinedRTDASPacketData);

        if (!NMEAControllerSingleton) {
            NMEAControllerSingleton = require("../controllers/nmeaController");
        }
        const NMEAController = NMEAControllerSingleton.getInstance();
        NMEAController.processNMEATypeData(incomingDataShipNameIdentifier, incomingDataVesselId, combinedRTDASPacketData);

        FleetDashboardController.prepareAndSendDataOnSocket(incomingDataShipNameIdentifier, incomingDataVesselId, combinedRTDASPacketData);

        const latestTimestamp = combinedRTDASPacketData.get("Timestamp");
        RealTimeParameterDataHolder.setDataByKey(incomingDataVesselId, "timestamp", latestTimestamp);

        vesselInstanceByVesselName.updateDataForRuleExecution(combinedRTDASPacketDataJson, incomingDataShipNameIdentifier, incomingDataVesselId);
        WidgetsParametersController.prepareDashboardData(combinedRTDASPacketData, incomingDataVesselId);

        const filterAlertData = await Util.filterKafkaData(appSettingsModel.getAppSettingsJsonData().kafkaTags,alertData)
        processAndSendDataOnKafka(incomingDataVesselId, incomingDataShipNameIdentifier , filterAlertData);
    };

    async createRuleChain(req,data) {

        let validationError = null;
        let operatorsAllowed = ['>','<','>=','<=','==','!=','<>','!<>'];
        let periodicityUnitAllowed = ['sec', 'min', 'hrs', 'days'];
        let conditionRegexp = new RegExp('^(' + operatorsAllowed.map(function (op) { return '\\' + op; }).join('|') + ')$');
        let periodicityUnitRegexp = new RegExp('^(' + periodicityUnitAllowed.map(function (op) { return op; }).join('|') + ')$');
        let thresholdRegex = new RegExp("^[0-9]*(\\.[0-9]+)?(\\|)?\\-?([0-9])+(\\.[0-9]+)?$");
        let evaluationFactorType = ['Probability', 'Standard Deviation', 'Count', 'Sum', 'Increasing', 'Decreasing','IncreasingContinuasly','DecreasingContinuasly','Average'];
        let evaluationFactorTypeRegexp = new RegExp('^(' + evaluationFactorType.map(function (op) { return op; }).join('|') + ')$');

        for (let [i,row] of data.entries()) {
            if(row.NoOfOccurrencesIsChecked.toLowerCase() === "true" || row.NoOfOccurrencesIsChecked.toLowerCase() === "false" || row.NoOfOccurrencesIsChecked === ""){
                if(row.NoOfOccurrencesIsChecked.toLowerCase() === "true"){
                    row.NoOfOccurrencesIsChecked = true;
                    if(typeof row.NoOfOccurrencesValue !== "number" || row.NoOfOccurrencesValue == ""){
                        validationError = "Invalid NoOfOccurrencesValue at " + ( i + 2 ) + " Row";
                    }
                } else {
                    row.NoOfOccurrencesIsChecked = false;
                    row.NoOfOccurrencesValue = "";
                }
            }else{
                validationError = "Invalid NoOfOccurrencesIsChecked at " + ( i + 2 ) + " Row";
            }
            if(row.isEvaluationFactorChecked.toLowerCase() === "true" || row.isEvaluationFactorChecked.toLowerCase() === "false" || row.isEvaluationFactorChecked == ""){
                if(row.isEvaluationFactorChecked.toLowerCase() === "true"){
                    row.isEvaluationFactorChecked = true;
                    if(!evaluationFactorTypeRegexp.test(row.isEvaluationFactorType)){
                        validationError = "Invalid isEvaluationFactorType at " + ( i + 2 ) + " Row";
                    } else {
                        if(row.isEvaluationFactorType == "Increasing" || row.isEvaluationFactorType == "Decreasing" || row.isEvaluationFactorType == "IncreasingContinuasly" || row.isEvaluationFactorType == "DecreasingContinuasly"){
                            row.isEvaluationFactorValue = "";
                        }else{
                            if(typeof row.isEvaluationFactorValue !== "number" || row.isEvaluationFactorValue == ""){
                                validationError = "Invalid isEvaluationFactorValue at " + ( i + 2 ) + " Row";
                            }
                        }
                    }
                } else {
                    row.isEvaluationFactorChecked = false;
                    row.isEvaluationFactorType = "Probability";
                    row.isEvaluationFactorValue = "";
                }
            } else {
                validationError = "Invalid isEvaluationFactorChecked at " + ( i + 2 ) + " Row";
            }
            if(row.isAlarm.toLowerCase() === "true" || row.isAlarm.toLowerCase() === "false" || row.isAlarm.toLowerCase() === ""){
                if(row.isAlarm.toLowerCase() === "false"){
                    row.isAlarm = false;
                } else {
                    row.isAlarm = true;
                }
            }else{
                validationError = "Invalid isAlarm at " + ( i + 2 ) + " Row";
            }
            switch (true) {
                case !row.ParameterName:
                    validationError = "Invalid Parameter Name at " + ( i + 2 ) + " Row";
                    break;
                case !row.Condition:
                case row.Condition && !conditionRegexp.test(row.Condition):
                    validationError = "Invalid Condition at " + ( i + 2 ) + " Row";
                    break;
                case !row.Threshold:
                case row.Threshold && !thresholdRegex.test(row.Threshold):
                    validationError = "Invalid Threshold Value at " + ( i + 2 ) + " Row";
                    break;
                case !row.RuleName:
                    validationError = "Invalid Rule Name at " + ( i + 2 ) + " Row";
                    break;
                case !row.RuleDescription:
                    validationError = "Invalid Rule Description at " + ( i + 2 ) + " Row";
                    break;
                case !row.Message:
                    validationError = "Invalid Message Value at " + ( i + 2 ) + " Row";
                    break;
                case !row.MachineName:
                    validationError = "Invalid Machine Name Value at " + ( i + 2 ) + " Row";
                    break;
                case !row.Periodicity:
                case row.Periodicity && typeof row.Periodicity !== "number":
                    validationError = "Invalid Periodicity Value at " + ( i + 2 ) + " Row";
                    break;
                case !row.Periodunit:
                case row.Periodunit && !periodicityUnitRegexp.test(row.Periodunit):
                    validationError = "Invalid Period Unit Value at " + ( i + 2 ) + " Row";
                    break;
                case !row.VesselName:
                    validationError = "Invalid Vessel Name at " + ( i + 2 ) + " Row";
                    break;
            }

            if(validationError)
                return validationError;
        }

        let notFoundParameter = 0;
        let createdRules = 0;
        let parametersJsonData= await parameterModel.getParametersJsonData();
        const failureAdvisoryJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
        const causesJsonData = await causesModel.getCausesJsonData();
        const ruleConfigsJsonData = await RuleConfigsModel.getRuleConfigsJsonData();
        const ruleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();
        for(let i=0;i<data.length;i++){
            //let jsonForParameter = {name : data[i].RuleName, description : data[i].RuleDescription, unit : "U1", machine : data[i].MachineName, precision : "", isRealValue: true, isFixedValue: false, isCalculatedValue : false, rtdasMapping: data[i].TagName, specifiedRange: {isSpecifiedRange: false, isRange:true, range:{from:"",to:""}, isSingleValue:false, singleValue: {value:""}, isCalculatedExpression:false, calculatedExpression: {expression: "",expressionDetails: ""}}, normalRange: {isNormalRange: false,isRange: true,range: {from:"",to:""},isSingleValue: false,singleValue:{value:""},isCalculatedExpression: false,calculatedExpression: {expression: "",expressionDetails: ""}}, enumeratedValue:{isEnumeratedValue:false,values: []},scale:"1",vesselName: data[i].VesselName}
            //req.body = jsonForParameter;
            let vesselId = ShipModel.getShipIdByMappingName(data[i].VesselName);
            const isAlarm = data[i].isAlarm;
            const isFailureAdvisory = !data[i].isAlarm;
            let parameterKey = await ParametersController.checkStatusOfParameterCreation(data[i].ParameterName, vesselId);
            if(parameterKey === "") {
                console.log("parameter not found for this ship");
                ++notFoundParameter;
                continue;
            }
            let jsonForFailureAdvisory = {name:data[i].RuleName,description: data[i].Message,isFailureAdvisory:isFailureAdvisory,isAlarm:isAlarm,vesselName: data[i].VesselName}
            req.body="";
            req.body=jsonForFailureAdvisory;
            let FAkey = await failureAdvisoriesController.create(req);
            let jsonForCause = {name : data[i].RuleName,description:data[i].Message,vesselName: data[i].VesselName}
            req.body = "";
            req.body = jsonForCause;
            let causeKey = await causesController.create(req);
            let range = false;
            let singleValue = false;
            let operator = '>=';
            let from = "";
            let to = "";
            let value = "";
            let fromOperatorValue = "";
            let toOperatorValue = "";
            if(data[i]['Condition']=="<>" || data[i]['Condition']=="!<>"){
                range = true;
                let twoValue = data[i].Threshold.split('|');
                from = twoValue[0];
                to = twoValue[1];
                if(data[i]['Condition'] == "<>") {
                    fromOperatorValue = ">=";
                    toOperatorValue = "<=";
                } else {
                    fromOperatorValue = "<=";
                    toOperatorValue = ">=";
                }
            }else{
                singleValue = true;
                operator = data[i]['Condition'];
                value = data[i].Threshold;
            }
            let jsonForRuleConfig = {ruleName: data[i].RuleName, parameterId:parameterKey, description:data[i].RuleDescription, isActive:true, unit:"U1", condition:{isRange:range, range:{from:from,fromOperator: fromOperatorValue,to:to,toOperator: toOperatorValue}, isSingleValue:singleValue, singleValue : {value:value,valueOperator: operator}, isCalculatedExpression:false, calculatedExpression : {expression:"",expressionDetails:""}, isEnumeratedValue:false}, enumeratedValue: {isEnumeratedValue: false, values:[]},vesselName: data[i].VesselName}
            req.body = "";
            req.body = jsonForRuleConfig;
            let ruleconfigKey = await RuleConfogController.create(req);
            let jsonForRuleBlock = {name : data[i].RuleName, description : data[i].RuleDescription, isActivated : true, rules : [{value:ruleconfigKey, label:ruleConfigsJsonData[ruleconfigKey].ruleName}], evaluationMethod : {periodicity : {value : data[i].Periodicity,unit:data[i].Periodunit},
                    noOfOccurrences:{isChecked : data[i].NoOfOccurrencesIsChecked, value : data[i].NoOfOccurrencesValue}},
                evaluationFactor : {isEvaluationFactorChecked : data[i].isEvaluationFactorChecked, type : data[i].isEvaluationFactorType, value:data[i].isEvaluationFactorValue},
                vesselName: data[i].VesselName}
            req.body = "";
            req.body = jsonForRuleBlock;
            let ruleBlockKey = await ruleBlocksController.create(req);
            let jsonForOutcome = {CONFIG_ID: -1, isFailureAdvisory: true, isAlarm: false, failureAdvisory : FAkey, causes : "("+causeKey+")", causeRuleChain : [{cause : causeKey, ruleChains: "("+ruleBlockKey+")"}]}
            req.body = "";
            req.body = jsonForOutcome;
            req.body['vesselName'] = data[i].VesselName;
            let outcomeKey = await outcomesController.configureOutcome(req);
            if(outcomeKey == "-1") {
             ++createdRules;
            }
        }

        const fileName = req.file.originalname;
        const userId = req.session.user.id;
        const allData = JSON.stringify(data);
        const vesselName = data[0].VesselName;
        const vesselId = ShipModel.getShipIdByMappingName(vesselName);
        const dateTime = Util.getNewDate();
        const formattedDateTime = dateFormat(dateTime, Util.getCommonDateFormat());
        const result = await ruleCsvModal.saveRuleCsvData(fileName,allData,vesselId,userId,formattedDateTime);
        return createdRules+" ruls are created "+notFoundParameter+"rules skip";
    };
}

module.exports = rtdasController;
