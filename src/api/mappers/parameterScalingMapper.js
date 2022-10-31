'use strict';

const ParametersModel = require("../models/parametersModel");

let allParametersDataByShipName = {};

exports.allParametersDataByShipName = function () {
    return allParametersDataByShipName;
};

exports.getAllParametersDataByShipName = function (vesselId, parameterName) {
    if (!allParametersDataByShipName[vesselId]) {
        return "1";
    }
    if (!allParametersDataByShipName[vesselId][parameterName]) {
        return "1";
    }
    return allParametersDataByShipName[vesselId][parameterName];
};

exports.setParameterDataByShipName = function (vesselId, parameterName, scalingValue) {
    if (!allParametersDataByShipName[vesselId]) {
        allParametersDataByShipName[vesselId] = {};
        allParametersDataByShipName[vesselId][parameterName] = scalingValue;
    } else {
        allParametersDataByShipName[vesselId][parameterName] = scalingValue;
    }
};

exports.syncParameterScalingFromParameters = async function () {
    const parametersJsonData = await ParametersModel.getParametersJsonData();

    for (let parameterId in parametersJsonData) {
        if (parametersJsonData.hasOwnProperty(parameterId)) {
            const parameterData = parametersJsonData[parameterId];
            exports.setParameterDataByShipName(parameterData["vesselId"], parameterData.name, parameterData.scale);
        }
    }
};