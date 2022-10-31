'use strict';

/*
* CRUD CONTROLLER
* */

const ParameterController = require("./parametersController");
const AudiTrailModel = require("../models/auditTrailModel");
const ParametersModel = require("../models/parametersModel");
const RuleConfigsModel = require("../models/ruleConfigsModel");
const ShipModel = require("../models/shipModel");
const {Util} = require("../utils/util");
const _ = require('lodash');

const create = async function (request) {
    const data = request.body;

    if (!data)
        throw new Error('Cannot store empty rule!');

    const ruleConfigsJsonData = await RuleConfigsModel.getRuleConfigsJsonData();
    if (Object.values(ruleConfigsJsonData).includes(data.ruleName)) {
        return "Rule name already exists!!!"
    }

    const ruleConfigData = {
        companyName: request.session.user.CompanyName,
        condition: data.condition,
        description: data.description,
        enumeratedValue: data.enumeratedValue,
        isActive: data.isActive,
        parameterId: parseInt(data.parameterId),
        ruleName: data.ruleName,
        unit: data.unit,
        userId: request.session.user.id,
        vesselId: ShipModel.getShipIdByMappingName(data.vesselName)
    }

    const result = await RuleConfigsModel.createRuleConfig(ruleConfigData);

    if (result.id) {
        const ruleConfigId = result.id;
        ruleConfigData.id = ruleConfigId;
        ruleConfigsJsonData[ruleConfigId] = ruleConfigData;

        await ParameterController.createRuleConfigReferenceInParameter(ruleConfigId, ruleConfigData);

        const auditTrailInfo = Util.getAuditTrailInfo("create", "Rule", ruleConfigData.ruleName);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        console.log("Rule Config inserted successfully!!!");
        return ruleConfigId;
    } else {
        return "Error occurred while creating a Rule!!!";
    }

};

const readById = function (ruleConfigId) {
    let ruleConfig = {};
    ruleConfig[ruleConfigId] = RuleConfigsModel.getRuleConfigsJsonData()[ruleConfigId];
    return ruleConfig;
};

const readAll = async function (request) {
    let ruleConfigJsonData = await RuleConfigsModel.getRuleConfigsJsonData();
    return ruleConfigJsonData;
};

const readAllByShip = async function (request) {
    let ruleConfigJsonData = await RuleConfigsModel.getRuleConfigsJsonData();
    const vesselName = request.query.vesselName;
    let ruleConfigJsonDataCopy = _.cloneDeep(ruleConfigJsonData);
    let ruleConfigFilterByVessel = Util.filterRecordsByVesselId(ruleConfigJsonDataCopy,ShipModel.getShipIdByMappingName(vesselName));
    return ruleConfigFilterByVessel;
};

const readAllByShipForPagination = async function (request) {
    const {
        vesselName,
        activePage,
        searchArr,
    } = request.query;

    let ruleConfigJsonData = RuleConfigsModel.getRuleConfigsJsonData();
    let ruleConfigJsonDataCopy = _.sortBy(_.cloneDeep(ruleConfigJsonData), 'ruleName');

    return activePage
        ? Util.filterRecordsByVesselIdForPagination(ruleConfigJsonDataCopy, ShipModel.getShipIdByMappingName(vesselName), activePage, JSON.parse(searchArr))
        : Util.filterRecordsByVesselId(ruleConfigJsonDataCopy, ShipModel.getShipIdByMappingName(vesselName), activePage);
};

const update = async function (request) {
    const data = request.body;

    if (!data)
        throw new Error('Cannot update rule config due to insufficient details!');

    const ruleConfigId = parseInt(Object.keys(data)[0]);

    const updatedRuleConfigData = {
        id: ruleConfigId,
        companyName: request.session.user.CompanyName,
        condition: data[ruleConfigId].condition,
        description: data[ruleConfigId].description,
        enumeratedValue: data[ruleConfigId].enumeratedValue,
        isActive: data[ruleConfigId].isActive,
        parameterId: parseInt(data[ruleConfigId].parameterId),
        ruleName: data[ruleConfigId].ruleName,
        unit: data[ruleConfigId].unit,
        userId: request.session.user.id,
        vesselId: ShipModel.getShipIdByMappingName(data[ruleConfigId].vesselName)
    }

    const result = await RuleConfigsModel.updateRuleConfigById(updatedRuleConfigData);

    if (result.id) {
        const ruleConfigsJsonData = await RuleConfigsModel.getRuleConfigsJsonData();
        let oldRuleConfigData = ruleConfigsJsonData[ruleConfigId];
        updatedRuleConfigData.id = ruleConfigId;
        ruleConfigsJsonData[ruleConfigId] = updatedRuleConfigData;
        await ParameterController.updateRuleConfigReferenceInParameter(oldRuleConfigData, updatedRuleConfigData);

        const auditTrailInfo = Util.getAuditTrailInfo("update", "Rule", updatedRuleConfigData.ruleName);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        return "Rule updated successfully!!!";
    } else {
        return "Error occurred while updating a Rule!!!";
    }

};

const removeById = async function (ruleConfigId) {
    const ruleConfigsJsonData = await RuleConfigsModel.getRuleConfigsJsonData();
    const refName = ruleConfigsJsonData[ruleConfigId].parameterId;
    const ruleConfigsReferencesRuleBlocksJsonData = await RuleConfigsModel.getRuleConfigsReferencesRuleBlocksJsonData();

    if (ruleConfigsReferencesRuleBlocksJsonData && ruleConfigsReferencesRuleBlocksJsonData.hasOwnProperty(ruleConfigId)) {
        return "already in used.";
    } else if(ruleConfigsJsonData && ruleConfigsJsonData.hasOwnProperty(ruleConfigId)){
        const result = await RuleConfigsModel.deleteRuleConfigById(ruleConfigId);
        let data;
        if(result.id){
            const parameterReferenceData = await ParametersModel.getParametersReferencesRuleConfigJsonData();
            data = delete ruleConfigsJsonData[ruleConfigId];
            if (parameterReferenceData && parameterReferenceData.hasOwnProperty(refName)) {
                const result = await ParametersModel.deleteParameterReferencesRuleConfigById(refName);
                if(result)
                    delete parameterReferenceData[refName];
                else
                    return "Parameter Reference Rule Config Not Deleted";
            }
            return data;
        } else {
            return "Rule Config Not Deleted"
        }
    } else {
        return "Id not available";
    }
};

const removeAll = function () {

};

const readAllOnlyNames = async function () {
    let data = await RuleConfigsModel.getRuleConfigsJsonData();
    let processedData = [];

    for (let dataItem in data) {
        let processDataItem = {};

        if (data.hasOwnProperty(dataItem)) {
            processDataItem[dataItem] = data[dataItem]["ruleName"];
            processedData.push(processDataItem);
        }
    }

    return processedData;
};

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    readAllByShip: readAllByShip,
    readAllByShipForPagination: readAllByShipForPagination,
    update: update,
    removeById: removeById,
    removeAll: removeAll,

    readAllOnlyNames: readAllOnlyNames
};
