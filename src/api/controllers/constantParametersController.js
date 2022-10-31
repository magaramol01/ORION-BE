'use strict';

/*
* CRUD CONTROLLER
* */

const AudiTrailModel = require("../models/auditTrailModel");
const ConstantParametersModel = require("../models/constantParameterModel");
const {Util} = require("../utils/util");
const _ = require('lodash');

const create = async function (request) {
    const constantParameterData = request.body;

    if (!constantParameterData)
        throw new Error('Cannot store empty constant parameter!');

    const constantParametersJsonData = await ConstantParametersModel.getConstantParametersJsonData();
    if (Object.values(constantParametersJsonData).includes(constantParameterData.name)) {
        return "Constant Parameter name already exists!!!"
    }

    constantParameterData['userId']=request.session.user.id;
    constantParameterData['ShipName']=request.session.user.selectedShipName;
    constantParameterData['companyName']=request.session.user.CompanyName;
    const result = await ConstantParametersModel.createConstantParameter(constantParameterData);

    if (result.inserted > 0) {
        const constantParameterKey = result.generated_keys[0];
        constantParametersJsonData[constantParameterKey] = constantParameterData;

        const auditTrailInfo = Util.getAuditTrailInfo("create", "Constant Parameter", constantParameterData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        console.log("Constant Parameter created successfully!!!");
        return constantParameterKey;
    } else {
        return "Error occurred while creating a Constant Parameter!!!";
    }

};

const readById = function (constantParameterId) {
    let constantParameter = {};
    constantParameter[constantParameterId] = ConstantParametersModel.getConstantParametersJsonData()[constantParameterId];
    return constantParameter;
};

const readAll = async function (request) {
     let constantParametersJsonData = await ConstantParametersModel.getConstantParametersJsonData();
     return constantParametersJsonData;
};

const readAllOnlyNames = function () {
    let constantParametersJsonData = ConstantParametersModel.getConstantParametersJsonData();
    let processedData = [];

    for (let dataItem in constantParametersJsonData) {
        if (constantParametersJsonData.hasOwnProperty(dataItem)) {
            processedData.push(constantParametersJsonData[dataItem]);
        }
    }

    return processedData;
};

const update = async function (request) {
    const updatedConstantParameterData = request.body;

    if (!updatedConstantParameterData)
        throw new Error('Cannot update constant parameter due to insufficient details!');

    updatedConstantParameterData[Object.keys(updatedConstantParameterData)[0]]['userId']=request.session.user.id;
    updatedConstantParameterData[Object.keys(updatedConstantParameterData)[0]]['ShipName']=request.session.user.selectedShipName;
    updatedConstantParameterData[Object.keys(updatedConstantParameterData)[0]]['companyName']=request.session.user.CompanyName;
    const result = await ConstantParametersModel.updateConstantParameterById(updatedConstantParameterData);

    if (result.replaced > 0) {
        const constantParametersJsonData = ConstantParametersModel.getConstantParametersJsonData();
        constantParametersJsonData[Object.keys(updatedConstantParameterData)[0]] = Object.values(updatedConstantParameterData)[0];

        const auditTrailInfo = Util.getAuditTrailInfo("update", "Constant Parameter", Object.values(updatedConstantParameterData)[0].name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        return "Constant Parameter updated successfully!!!";
    } else {
        return "Error occurred while updating a Constant Parameter!!!";
    }

};

const removeById = function (ConstantParameterId) {

};

const removeAll = function () {

};

const updateConstantParameterData = async function (request) {
    const constantParameterData = request.body;

    if (!constantParameterData)
        throw new Error('Cannot store empty constant parameter data!');

    const result = await ConstantParametersModel.updateConstantParameterData(constantParameterData);

    if (result.replaced > 0) {
        const auditTrailInfo = Util.getAuditTrailInfo("create", "Constant Parameter Data", constantParameterData.ID + constantParameterData.remark);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        return "Constant Parameter Data inserted successfully!!!";
    } else {
        return "Error occurred while inserting a Constant Parameter data!!!";
    }
};

const readAllConstantParameterHistoricalDataById = async function (request) {
    const constantParameterId = request.body.ID;
    return await ConstantParametersModel.getAllConstantParameterHistoricalDataById(constantParameterId);
};

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    update: update,
    removeById: removeById,
    removeAll: removeAll,

    updateConstantParameterData: updateConstantParameterData,
    readAllConstantParameterHistoricalDataById: readAllConstantParameterHistoricalDataById,
    readAllOnlyNames: readAllOnlyNames
};
