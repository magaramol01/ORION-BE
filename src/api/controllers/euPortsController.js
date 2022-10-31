'use strict';

/*
* CRUD CONTROLLER
* */
const EUPortsModel = require("../models/euPortsModel");
const _ = require('lodash');

const uploadEUPorts = function (euPortsJson) {
    const euPortsJsonLength = euPortsJson.length;

    for (let i = 0; i < euPortsJsonLength; i++) {
        const currObj = euPortsJson[i];
        if (currObj.Country && currObj.Port) {
            EUPortsModel.uploadEUPorts(currObj);
        }
    }
};

const saveEUPort = function (request) {
    return EUPortsModel.saveEUPort(request.body);
};

const getAllEUPorts = async function () {
    return await EUPortsModel.getAllEUPorts();
};

const syncAllEUPorts = async function () {
    return await EUPortsModel.syncAllEUPorts();
};

const isEUPort = function (country, port) {
    country = _.capitalize(country);
    const euPortsMap = EUPortsModel.getAllEUPorts();
    if (euPortsMap.has(country)) {
        const portValues = euPortsMap.get(country);
        return portValues.includes(port);
    } else {
        return false;
    }
};

module.exports = {
    saveEUPort: saveEUPort,
    uploadEUPorts: uploadEUPorts,
    getAllEUPorts: getAllEUPorts,
    syncAllEUPorts: syncAllEUPorts,
    isEUPort: isEUPort
};