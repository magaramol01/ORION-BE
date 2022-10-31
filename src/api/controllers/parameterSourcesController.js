'use strict';

/*
* CRUD CONTROLLER
* */

const ParameterSourcesModel = require("../models/parameterSourceModel");
const UnitsModel = require("../models/unitsModel");
const {Util} = require("../utils/util");
const _ = require('lodash');
const rtdasController = require("../controllers/rtdasController");

const create = async function (request) {

};

const readById = function (parameterSourceId) {
    let parameterSource = {};
    parameterSource[parameterSourceId] = ParameterSourcesModel.getParameterSourcesJsonData()[parameterSourceId];
    return parameterSource;
};

const readAll = async function (request) {
    let parameterSourcesJsonData = await ParameterSourcesModel.getParameterSourcesJsonData();
    let parameterSourcesJsonDataCopy = _.cloneDeep(parameterSourcesJsonData);

    return Util.processAllData(request, parameterSourcesJsonDataCopy);
};

const update = async function (request) {

};

const removeById = function (parameterId) {

};

const removeAll = function () {

};

const getParameterSourcesAndUnits = async function (request) {
    const RTDASController = new rtdasController();
    return {
        parametersSource: await RTDASController.getAllRTDASMappingInJson(request),
        units: await UnitsModel.getUnitsJsonData()
    };
};

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    update: update,
    removeById: removeById,
    removeAll: removeAll,

    getParameterSourcesAndUnits: getParameterSourcesAndUnits
};
