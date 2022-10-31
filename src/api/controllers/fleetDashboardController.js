'use strict';

const _ = require('lodash');
const appSettingsModel = require('../models/appSettingsModel');
const FleetDashboardStateJson = require("../../../configured_data/Data/fleetDashboard.json");
const ShipController = require("../controllers/shipController");
const UserController = require("../controllers/userController");
const MRVNoonReportController = require("./mrvNoonReportController");
const TriggeredOutcomesTodayController = require("./triggeredOutcomesTodayController");
const RealTimeParameterDataHolder = require("../mappers/realTimeParameterDataHolder");
const WebSocketAdaptor = require("../adaptors/webSocketAdaptor");
const {traverseNestedTillLastNode} = require("./widgetsParametersController");
const {Util} = require("../utils/util");
const dateFormat = require('dateformat');

const getFleetDashboardState = async function (request) {
    const fleetDashboardStateJsonCopy = _.cloneDeep(FleetDashboardStateJson);
    traverseNestedTillLastNode(fleetDashboardStateJsonCopy, new Map(), parseInt(request.query.vesselId));

    const shipsData = await UserController.getAllShips(request);
    const allShipData = await ShipController.getAllData();

    return {
        fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
        fleetDashboardStateJson: fleetDashboardStateJsonCopy,
        shipNameData: shipsData,
        allShipData: allShipData
    };
};

const getFleetDashboardParametersFilterData = function () {
    let parameterValuesCopy = _.cloneDeep(appSettingsModel.getAppSettingsJsonData().fleetDashboardConfig.parametersList);
    //we make deep copy because it change for sheep wise .
    return parameterValuesCopy;
};

const getFleetDashboardParametersCardData = async function (request) {
    let allVesselsRequiredDetails = [];
    const ignoredVessels = appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter;

    const allVesselsVoyageDetails = await MRVNoonReportController.getAllVesselsVoyageDetails();
    const getLatestAlarm = await TriggeredOutcomesTodayController.getAllVesselsLatestAlarms("alarm");

    for (let i = 0; i < allVesselsVoyageDetails.length; i++) {
        const record = allVesselsVoyageDetails[i];
        if(ignoredVessels.includes(record.vesselId)){
            continue;
        }
        const latestAlarm = _.find(getLatestAlarm, {vesselid: record.vesselId});
        const secoundValue = parseInt(record.TotalDistRun) + parseInt(record.DistToGo);
        const firstValue = parseInt(record.TotalDistRun) * 100;
        const progressValue = parseFloat(parseFloat(firstValue/secoundValue).toFixed(2));


        allVesselsRequiredDetails.push({
            vesselId: record.vesselId,
            voyageId: record.Voyage.replace("/From", "").trim(),
            eta: record.ETANextPort.trim(),
            progress: progressValue,
            sourcePort: record.Scr.trim(),
            destinationPort: record.Destination.trim(),
            parameterValues: prepareAndGetParameterValuesObj(record.vesselId),
            engineValues: prepareAndGetEngineValuesObj(record.vesselId),
            latestAlarm: latestAlarm ? latestAlarm.observantmessage : "",
            coveredDistance : parseInt(record.TotalDistRun),
            distanceToGo : parseInt(record.DistToGo),
            timestamp : prepareAndGetLastTimeValuesObj(record.vesselId)
        });
    }

    return allVesselsRequiredDetails;
};

const prepareAndGetParameterValuesObj = function (vesselId) {
    const parametersList = getFleetDashboardParametersFilterData();
    const parametersListKeys = Object.keys(parametersList);
    for (let i = 0; i < parametersListKeys.length; i++) {
        const paramKey = parametersListKeys[i];
        const parameter = parametersList[paramKey];
        parameter["value"] = RealTimeParameterDataHolder.getDataByKey(vesselId, parameter.modbusTag);
    }

    return parametersList;
};

const prepareAndGetEngineValuesObj = function (vesselId) {
    const appSettingsJsonData = appSettingsModel.getAppSettingsJsonData();
    const engineSection = _.cloneDeep(appSettingsJsonData.fleetDashboardConfig.engineSection);
    const engineValues = engineSection.modbusTags;

    for (let i = 0; i < engineValues.length; i++) {
        const engineValue = engineValues[i];
        engineValue["value"] = RealTimeParameterDataHolder.getDataByKey(vesselId, engineValue.modbusTag);
    }

    return engineSection;
};

const prepareAndGetLastTimeValuesObj = function (vesselId) {
    let time = RealTimeParameterDataHolder.getDataByKey(vesselId, "timestamp");
    if(!!time){
        time = dateFormat(time,Util.getCommonDateFormat());
    }
    return time;
};


const prepareAndSendDataOnSocket = function (vesselName, vesselId, rtdasPacketData) {
    const appSettingsJsonData = appSettingsModel.getAppSettingsJsonData();
    const engineSection = _.cloneDeep(appSettingsJsonData.fleetDashboardConfig.engineSection);
    const engineValues = engineSection.modbusTags;
    let timestamp = rtdasPacketData.get("Timestamp");
    if(!!timestamp){
        timestamp = dateFormat(timestamp, Util.getCommonDateFormat())
    }

    for (let i = 0; i < engineValues.length; i++) {
        const engineValue = engineValues[i];
        const modbusTag = engineValue.modbusTag;
        let realTimeValue;
        if (rtdasPacketData.has(modbusTag)) {
            realTimeValue = rtdasPacketData.get(modbusTag);
            realTimeValue = parseInt(realTimeValue).toFixed(0);
            RealTimeParameterDataHolder.setDataByKey(vesselId, modbusTag, realTimeValue);
        } else {
            realTimeValue = RealTimeParameterDataHolder.getDataByKey(vesselId, modbusTag);
        }
        engineValue["value"] = realTimeValue;
    }

    const parametersList = getFleetDashboardParametersFilterData();
    const parametersListKeys = Object.keys(parametersList);
    for (let i = 0; i < parametersListKeys.length; i++) {
        const paramKey = parametersListKeys[i];
        const parameter = parametersList[paramKey];
        const modbusTag = parameter.modbusTag;
        let realTimeValue;
        if (rtdasPacketData.has(modbusTag)) {
            realTimeValue = rtdasPacketData.get(modbusTag);
            realTimeValue = parseInt(realTimeValue).toFixed(2);
            RealTimeParameterDataHolder.setDataByKey(vesselId, modbusTag, realTimeValue);
        } else {
            realTimeValue = RealTimeParameterDataHolder.getDataByKey(vesselId, modbusTag);
        }
        parameter["value"] = realTimeValue;
    }

    WebSocketAdaptor.emitDataOnSocketGlobal("subscribeToFleetDashboard", {otherData: {
            "parameterValues": parametersList,
            "engineValues": engineSection,
            "shipName": vesselName,
            "vesselId": vesselId,
            "timestamp": timestamp
        }}, vesselId);
};

const allShipSourceDastinationData = async function () {
    const allVesselsVoyageDetails = await MRVNoonReportController.getAllVesselsVoyageDetails();
    let responseData = {};
    for(let i =0;i<allVesselsVoyageDetails.length;i++){
        responseData[allVesselsVoyageDetails[i].vesselId] = {
            voyageId: allVesselsVoyageDetails[i].Voyage.replace("/From", "").trim(),
            sourcePort: allVesselsVoyageDetails[i].Scr.trim(),
            destinationPort: allVesselsVoyageDetails[i].Destination.trim(),
        }
    }
    return responseData;
};

module.exports = {
    allShipSourceDastinationData: allShipSourceDastinationData,
    getFleetDashboardState: getFleetDashboardState,
    getFleetDashboardParametersFilterData: getFleetDashboardParametersFilterData,
    getFleetDashboardParametersCardData: getFleetDashboardParametersCardData,
    prepareAndGetParameterValuesObj: prepareAndGetParameterValuesObj,
    prepareAndGetEngineValuesObj: prepareAndGetEngineValuesObj,
    prepareAndSendDataOnSocket: prepareAndSendDataOnSocket
};