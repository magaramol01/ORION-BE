'use strict';

/*
* CRUD CONTROLLER
* */

const AudiTrailModel = require("../models/auditTrailModel");
const calculatedExpressionModel = require("../models/calculatedExpressionModel");
const {Util} = require("../utils/util");
const _ = require('lodash');

const create = async function (request) {
    const calculatedExpressionData = request.body;

    if (!calculatedExpressionData)
        throw new Error('Cannot store empty Calculated Expression!');

    const calculatedExpressionJsonData = await calculatedExpressionModel.getCalculatedExpressionJsonData();
    if (Object.values(calculatedExpressionJsonData).includes(calculatedExpressionData.name)) {
        return "calculatedExpression name already exists!!!"
    }
    const result = await calculatedExpressionModel.createCalculatedExpression(calculatedExpressionData);

    if (result.inserted > 0) {
        const calculatedExpressionKey = result.generated_keys[0];
        calculatedExpressionJsonData[calculatedExpressionKey] = calculatedExpressionData;

        const auditTrailInfo = Util.getAuditTrailInfo("create", "Calculated Expression", calculatedExpressionData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        console.log("Calculated Expression created successfully!!!");
        return calculatedExpressionKey;
    } else {
        return "Error occurred while creating a Calculated Expression!!!";
    }
};

const readById = function (calculatedExpressionId) {
    let calculatedExpression = {};
    calculatedExpression[calculatedExpressionId] = calculatedExpressionModel.getCalculatedExpressionJsonData()[calculatedExpressionId];
    return calculatedExpression;
};

const readAll = async function (request) {
    let calculatedExpressionJsonData = await calculatedExpressionModel.getCalculatedExpressionJsonData();
    let calculatedExpressionJsonDataCopy = _.cloneDeep(calculatedExpressionJsonData);
    return Util.processAllData(request, calculatedExpressionJsonDataCopy);
};

const update = async function (request) {
    const updatedCalculatedExpressionData = request.body;

    if (!updatedCalculatedExpressionData)
        throw new Error('Cannot update calculated Expression due to insufficient details!');

    const result = await calculatedExpressionModel.updateCalculatedExpressionById(updatedCalculatedExpressionData);

    if (result.replaced > 0) {
        const calculatedExpressionJsonData = await calculatedExpressionModel.getCalculatedExpressionJsonData();
        calculatedExpressionJsonData[Object.keys(updatedCalculatedExpressionData)[0]] = Object.values(updatedCalculatedExpressionData)[0];

        const auditTrailInfo = Util.getAuditTrailInfo("update", "Calculated Expression", Object.values(updatedCalculatedExpressionData)[0].name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        return "Calculated Expression updated successfully!!!";
    } else {
        return "Error occurred while updating a Calculated Expression!!!";
    }
};

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    update: update,
};
