'use strict';

let parametersData = {};

exports.getAllData = function () {
    return parametersData;
};

exports.getDataByKey = function (vesselId, key) {
    if (parametersData[vesselId] && parametersData[vesselId][key]) {
        return parametersData[vesselId][key];
    } else {
        return null;
    }
};

exports.setDataByKey = function (vesselId, key, value) {
    if (!parametersData[vesselId]) {
        parametersData[vesselId] = {};
    } else {
        parametersData[vesselId][key] = value;
    }
};

exports.getAllDataByVesselId = function (vesselId) {
    const data = parametersData[vesselId];
    return data ? data : {};
};