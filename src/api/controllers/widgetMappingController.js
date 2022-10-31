'use strict';

/*
* CRUD CONTROLLER
* */

const _ = require('lodash');
const widgetMappingModel = require('../models/widgetMappingModel');
const AudiTrailModel = require("../models/auditTrailModel");
const ShipModel = require("../models/shipModel");
const {Util} = require("../utils/util");
const widgetTagMapping = require("../mappers/widgetTagMapping");
const widgetsParametersController = require("../controllers/widgetsParametersController");
const DashboardStateJson = require("../../../configured_data/Data/newTesting1.json");
const MainEngineStateJson = require("../../../configured_data/Data/newTesting2");
const MainGaugesStateJson = require("../../../configured_data/Data/newTesting");
const DigitalAlarmStateJson = require("../../../configured_data/Data/digitalAlarm");
const { Parser } = require('json2csv');

const saveWidgetCsvFile = async function (data, fileName,userId,ip) {

    //Validation of all Rows
    let validationError = null;
    let specifiedRangeRegex = new RegExp("^[0-9]+(\\.[0-9]+)?(\\|)+\\-?([0-9])+(\\.[0-9]+)?$");

    for (let [i,row] of data.entries()) {
        switch (true) {
            case !row.widgetId || !row.widgetId.startsWith("WID"):
                validationError = "Invalid Widget Id at " + ( i + 2 ) + " Row";
                break;
            /*case !row.value:
                validationError = "Invalid Value at " + ( i + 2 ) + " Row";
                break;
            case !row.caption:
                validationError = "Invalid Caption at " + ( i + 2 ) + " Row";
                break;
            case !row.unit:
                validationError = "Invalid Unit Value at " + ( i + 2 ) + " Row";
                break;*/
            case !row.vesselName:
                validationError = "Invalid VesselName Value at " + ( i + 2 ) + " Row";
                break;
            case row.startValue && (isNaN(Number(row.precision))):
                validationError = "Invalid Precision Value at " + ( i + 2 ) + " Row";
                break;
            case row.startValue && isNaN(Number(row.startValue)):
                validationError = "Invalid Start Value at " + ( i + 2 ) + " Row";
                break;
            case row.endValue && isNaN(Number(row.endValue)):
                validationError = "Invalid End Value at " + ( i + 2 ) + " Row";
                break;
            case row.minValue && isNaN(Number(row.minValue)):
                validationError = "Invalid Min Value at " + ( i + 2 ) + " Row";
                break;
            case row.maxValue && isNaN(Number(row.maxValue)):
                validationError = "Invalid Max Value at " + ( i + 2 ) + " Row";
                break;
            case row.lowerBoundValue && isNaN(Number(row.lowerBoundValue)):
                validationError = "Invalid LowerBound Value at " + ( i + 2 ) + " Row";
                break;
            case row.upperBoundValue && isNaN(Number(row.upperBoundValue)):
                validationError = "Invalid UpperBound Value at " + ( i + 2 ) + " Row";
                break;
            case row.hideMinValue && isNaN(Number(row.hideMinValue)):
                validationError = "Invalid HideMin Value at " + ( i + 2 ) + " Row";
                break;
            case row.hideMaxValue && isNaN(Number(row.hideMaxValue)):
                validationError = "Invalid HideMax Value at " + ( i + 2 ) + " Row";
                break;
        }

        if(validationError)
            return validationError;
    }


    const vesselName = data[0].vesselName;
    const vesselId = ShipModel.getShipIdByMappingName(vesselName);
    const isLatest = true;
    let jsonData = {};

    const widgetToTagMap = new Map();

    for (let i=0;i<data.length;i++){
        const csvRow = data[i];
        const widgetId = csvRow.widgetId;
        const value = csvRow.value;
        const caption = csvRow.caption;
        const unit = csvRow.unit;
        const precision = csvRow.precision;
        const startValue = csvRow.startValue;
        const endValue = csvRow.endValue;
        const minValue = csvRow.minValue;
        const maxValue = csvRow.maxValue;
        const lowerBoundValue = csvRow.lowerBoundValue;
        const upperBoundValue = csvRow.upperBoundValue;
        const hideMinValue = csvRow.hideMinValue;
        const hideMaxValue = csvRow.hideMaxValue;
        const digitalData=csvRow.digitalData;
        let eachData = {};
        eachData["tag"] = value;
        eachData["caption"] = caption;
        eachData["unit"] = unit;
        eachData["precision"] = precision;
        eachData["startValue"] = startValue;
        eachData["endValue"] = endValue;
        eachData["minValue"] = minValue;
        eachData["maxValue"] = maxValue;
        eachData["lowerBoundValue"] = lowerBoundValue;
        eachData["upperBoundValue"] = upperBoundValue;
        eachData["hideMinValue"] = hideMinValue;
        eachData["hideMaxValue"] = hideMaxValue;
        eachData["digitalData"]=digitalData;
        jsonData[widgetId] = eachData;
        let mapClass = new widgetTagMapping();
        mapClass.setTag(value);
        mapClass.setCaption(caption);
        mapClass.setUnit(unit);
        mapClass.setPrecision(precision);
        mapClass.setStartValue(startValue);
        mapClass.setEndValue(endValue);
        mapClass.setMinValue(minValue);
        mapClass.setMaxValue(maxValue);
        mapClass.setLowerBoundValue(lowerBoundValue);
        mapClass.setUpperBoundValue(upperBoundValue);
        mapClass.setHideMinValue(hideMinValue);
        mapClass.setHideMaxValue(hideMaxValue);
        mapClass.setDigitalData(digitalData);
        widgetToTagMap.set(widgetId, mapClass);
    }

    let allWidgetMappingTagJsonData = widgetMappingModel.getAllWidgetTagMappingJsonData();
    const updateResponse = await widgetMappingModel.updatePreviousIsLatest(vesselId);
    const result = await widgetMappingModel.uploadWidgetTagFile(vesselId,userId,isLatest,jsonData,fileName,JSON.stringify(data));

    if (result.id) {
        const createdWidgetId = result.id;

        console.log(widgetToTagMap);
        allWidgetMappingTagJsonData[vesselId] = widgetToTagMap;

        let DashboardStateJsonCopy = _.cloneDeep(DashboardStateJson);
        let MainEngineStateJsonCopy = _.cloneDeep(MainEngineStateJson);
        let MainGaugesStateJsonCopy = _.cloneDeep(MainGaugesStateJson);
        let DigitalAlarmStateJsonCopy = _.cloneDeep(DigitalAlarmStateJson)
        await widgetsParametersController.traversedJsonFileToAddData(DashboardStateJsonCopy,allWidgetMappingTagJsonData[vesselId]);
        widgetsParametersController.setDashboardStateJsonByVesselId(vesselId,DashboardStateJsonCopy);
        await widgetsParametersController.traversedJsonFileToAddData(MainEngineStateJsonCopy,allWidgetMappingTagJsonData[vesselId]);
        widgetsParametersController.setMainEngineStateJsonByVesselId(vesselId,MainEngineStateJsonCopy);
        await widgetsParametersController.traversedJsonFileToAddData(MainGaugesStateJsonCopy,allWidgetMappingTagJsonData[vesselId]);
        widgetsParametersController.setMainGaugesStateJsonByVesselId(vesselId,MainGaugesStateJsonCopy);
        await widgetsParametersController.traversedJsonFileToAddData(DigitalAlarmStateJsonCopy,allWidgetMappingTagJsonData[vesselId]);
        widgetsParametersController.setDigitalAlarmStateJsonByVesselId(vesselId,DigitalAlarmStateJsonCopy);

        const auditTrailInfo = Util.getAuditTrailInfo("upload",  "widget Mapping csv", fileName);
        AudiTrailModel.saveAuditTrail({
            userId: userId,
            ipAddress: ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        console.log("Widget Mapping File upload successfully!!!");
        return "File has been uploaded successfully and changes have been updated on the vessel Dashboard";
    } else {
        return "Error occurred while uploading widget mapping file!!!";
    }
};

const getLastUpdatedCsvFile = async function(request){
    const vesselName = request.query.vesselName;
    const vesselId = ShipModel.getShipIdByMappingName(vesselName);
    let Response;
    if(!!vesselId){
        Response = await widgetMappingModel.getLastUpdatedWidgetByShip(vesselId);
    }
    return Response;
};

const downloadcsvFile = async function(request,reply){
    console.log(request);
    const vesselId = parseInt(request.query.vesselId);
    const fileName = request.query.fileName;
    const id = parseInt(request.query.id);
    let originalData = await widgetMappingModel.getOriginalData(id,vesselId);
    originalData = JSON.parse(originalData.originaldata);
    console.log(request);
    const fields = ["widgetId", "value", "caption", "unit","vesselName","precision","startValue","endValue","minValue","maxValue","lowerBoundValue","upperBoundValue","hideMinValue","hideMaxValue"];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(originalData);
    return {cavData:csv,fileName:fileName};
}

module.exports = {
    saveWidgetCsvFile: saveWidgetCsvFile,
    getLastUpdatedCsvFile: getLastUpdatedCsvFile,
    downloadcsvFile: downloadcsvFile
};
