'use strict';

/*
* CRUD CONTROLLER
* */

const AudiTrailModel = require("../models/auditTrailModel");
const RuleBlocksModel = require("../models/ruleBlocksModel");
const RuleConfigsModel = require("../models/ruleConfigsModel");
const CausesModel = require("../models/causesModel");
const {Util} = require("../utils/util");
const _ = require('lodash');
const RuleExecutionSingletonController = require("./ruleExecutionSingletonController");
const ShipModel = require('../models/shipModel');

const create = async function (request) {
    const ruleBlocksData = request.body;
    let rules = [];

    if (!ruleBlocksData)
        throw new Error('Cannot store empty rule block!');

    const ruleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();
    if (Object.values(ruleBlocksJsonData).includes(ruleBlocksData.name)) {
        return "Rule Block name already exists!!!"
    }

    let rulesObj = ruleBlocksData["rules"];
    for (let index in rulesObj) {
        rules.push(rulesObj[index]["value"].toString());
    }
    ruleBlocksData["rules"] = JSON.stringify(rules);

    ruleBlocksData['userId']=request.session.user.id;
    ruleBlocksData['companyName']=request.session.user.CompanyName;
    ruleBlocksData['vesselId']= ShipModel.getShipIdByMappingName(ruleBlocksData["vesselName"]);
    const result = await RuleBlocksModel.createRuleBlock(ruleBlocksData);

    if (result.id) {
        const ruleBlockKey = result.id;
        ruleBlocksData["rules"] = JSON.parse(ruleBlocksData.rules);
        ruleBlocksData.id = ruleBlockKey
        ruleBlocksJsonData[ruleBlockKey] = ruleBlocksData;

        await addRuleConfigReferenceRuleBlock(ruleBlockKey, ruleBlocksData.rules);
        const ruleExecutionSingletonController = RuleExecutionSingletonController.getInstance();
        ruleExecutionSingletonController.ScheduleRuleBlockForAVesselInstances(ruleBlockKey, ruleBlocksData);

        const auditTrailInfo = Util.getAuditTrailInfo("create", "Rule Block", ruleBlocksData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        console.log("Rule Block created successfully!!!");
        return ruleBlockKey;
    } else {
        return "Error occurred while creating a Rule Block!!!";
    }

};

const readById = function (ruleBlockId) {
    let ruleBlock = {};
    ruleBlock[ruleBlockId] = RuleBlocksModel.getRuleBlocksJsonData()[ruleBlockId];
    return ruleBlock;
};

const readAll = async function (request) {
    let RuleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();
    return RuleBlocksJsonData;
};

const readAllByShip = async function (request) {
    let RuleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();
    const vesselName = request.query.vesselName;
    let RuleBlocksJsonDataCopy = _.cloneDeep(RuleBlocksJsonData);
    let RuleBlocksFilterByVessel = Util.filterRecordsByVesselId(RuleBlocksJsonDataCopy,ShipModel.getShipIdByMappingName(vesselName));
    return RuleBlocksFilterByVessel;
};

const readAllByShipForPagination = async function (request) {
    const {
        vesselName,
        activePage,
        sortBy,
        searchArr
    } = request.query;
    let ruleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();

    return Util.filterRecordsByVesselIdForPagination(
        _.orderBy(_.cloneDeep(ruleBlocksJsonData), ['name'], [sortBy]),
        ShipModel.getShipIdByMappingName(vesselName),
        activePage,
        JSON.parse(searchArr)
    );
};

const update = async function (request) {
    const updatedRuleBlockData = request.body;

    if (!updatedRuleBlockData)
        throw new Error('Cannot update rule block due to insufficient details!');

    const ruleBlockId = Object.keys(updatedRuleBlockData)[0];
    let rulesObj = updatedRuleBlockData[ruleBlockId]["rules"];
    let rules = [];

    for (let index in rulesObj) {
        rules.push(rulesObj[index]["value"]);
    }
    updatedRuleBlockData[ruleBlockId]["rules"] = JSON.stringify(rules);

    updatedRuleBlockData[Object.keys(updatedRuleBlockData)[0]]['userId']=request.session.user.id;
    updatedRuleBlockData[Object.keys(updatedRuleBlockData)[0]]['companyName']=request.session.user.CompanyName;
    let vesselName = updatedRuleBlockData[Object.keys(updatedRuleBlockData)[0]]['vesselName'];
    updatedRuleBlockData[Object.keys(updatedRuleBlockData)[0]]["vesselId"] = ShipModel.getShipIdByMappingName(vesselName);
    const result = await RuleBlocksModel.updateRuleBlockById(updatedRuleBlockData);

    if (result) {
        const ruleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();

        let oldRuleBlockData = ruleBlocksJsonData[ruleBlockId];
        const oldRuleBlockDataPeriodicity = oldRuleBlockData.evaluationMethod.periodicity;
        const oldPeriodicityTime = oldRuleBlockDataPeriodicity.value;
        const oldPeriodicityUnit = oldRuleBlockDataPeriodicity.unit;
        const oldNoOfOccurrencesValue = oldRuleBlockData.evaluationMethod.noOfOccurrences.value;
        const oldnoOfOccurrencesCheckValue = oldRuleBlockData.evaluationMethod.noOfOccurrences.isChecked;
        const oldEvaluationFactorType = oldRuleBlockData.evaluationFactor.type;
        const oldEvaluationFactorValue = oldRuleBlockData.evaluationFactor.value;
        const oldEvaluationFactorIsCheckValue = oldRuleBlockData.evaluationFactor.isEvaluationFactorChecked;

        const updatedRuleBlockDataPeriodicity = updatedRuleBlockData[ruleBlockId].evaluationMethod.periodicity;
        const updatedPeriodicityTime = updatedRuleBlockDataPeriodicity.value;
        const updatedPeriodicityUnit = updatedRuleBlockDataPeriodicity.unit;
        const updatedNoOfOccurrencesValue = updatedRuleBlockData[ruleBlockId].evaluationMethod.noOfOccurrences.value;
        const updatedNoOfOccurrencesCheckValue = updatedRuleBlockData[ruleBlockId].evaluationMethod.noOfOccurrences.isChecked;
        const updatedEvaluationFactorType = updatedRuleBlockData[ruleBlockId].evaluationFactor.type;
        const updatedEvaluationFactorValue = updatedRuleBlockData[ruleBlockId].evaluationFactor.value;
        const updatedEvaluationFactorIsCheckValue = updatedRuleBlockData[ruleBlockId].evaluationFactor.isEvaluationFactorChecked;

        updatedRuleBlockData[ruleBlockId]["rules"] = JSON.parse(updatedRuleBlockData[ruleBlockId].rules);
        if (oldPeriodicityTime && oldPeriodicityUnit && updatedPeriodicityTime && updatedPeriodicityUnit) {
            if (oldPeriodicityTime !== updatedPeriodicityTime || oldPeriodicityUnit !== updatedPeriodicityUnit || oldNoOfOccurrencesValue !== updatedNoOfOccurrencesValue || oldnoOfOccurrencesCheckValue !== updatedNoOfOccurrencesCheckValue || oldEvaluationFactorType !== updatedEvaluationFactorType || oldEvaluationFactorValue !== updatedEvaluationFactorValue !== oldEvaluationFactorIsCheckValue !== updatedEvaluationFactorIsCheckValue) {
                const ruleExecutionSingletonController = RuleExecutionSingletonController.getInstance();
                ruleExecutionSingletonController.reScheduleRuleForAllVesselInstances(ruleBlockId, updatedRuleBlockData);
            }
        }

        updatedRuleBlockData[ruleBlockId]["id"] = parseInt(ruleBlockId);
        ruleBlocksJsonData[ruleBlockId] = Object.values(updatedRuleBlockData)[0];

        updateRuleConfigReferenceRuleBlock(updatedRuleBlockData,oldRuleBlockData);

        const auditTrailInfo = Util.getAuditTrailInfo("update", "Rule Block", Object.values(updatedRuleBlockData)[0].name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        return "Rule Block updated successfully!!!";
    } else {
        return "Error occurred while updating a Rule Block!!!";
    }

};

const removeById = async function (ruleBlockId) {
    const ruleBlockJsonData = RuleBlocksModel.getRuleBlocksJsonData();
    const ruleBlockReferenceCausesJsonData = await CausesModel.getCausesReferencesRuleConfigJsonData();
    const ruleConfigsReferencesRuleBlocksJsonData = RuleConfigsModel.getRuleConfigsReferencesRuleBlocksJsonData();

    for (let key in ruleBlockReferenceCausesJsonData) {
        const keyData = ruleBlockReferenceCausesJsonData[key];
        for (let subKey in keyData) {
            const finalArray = keyData[subKey];
            for (let finalKey in finalArray) {
                if (finalArray[finalKey].includes(ruleBlockId))
                    return "already in used.";
            }
        }
    }
    if (ruleBlockJsonData.hasOwnProperty(ruleBlockId)) {
        const result = await RuleBlocksModel.deleteRuleBlockById(ruleBlockId);
        let data;
        const refRulesArray = ruleBlockJsonData.hasOwnProperty(ruleBlockId) ? ruleBlockJsonData[ruleBlockId].rules : [];
        if(result){
            data = delete ruleBlockJsonData[ruleBlockId];
            console.log("Rule Block Deleted Successfully");
        }else{
            return "Error Occured";
        }

        for (let key in refRulesArray) {
            if (ruleConfigsReferencesRuleBlocksJsonData.hasOwnProperty(refRulesArray[key])) {
                const result = await RuleConfigsModel.deleteRuleConfigsReferencesRuleBlocksById(refRulesArray[key]);
                if(result>0){
                    console.log("Rule Config Reference Rule Block Delete Successfully !!!");
                    delete ruleConfigsReferencesRuleBlocksJsonData[refRulesArray[key]];
                }else{
                    return "Rule Config Reference Rule Block Not Delete Successfully !!!";
                }
            }
        }

        const ruleExecutionSingletonController = RuleExecutionSingletonController.getInstance();
        ruleExecutionSingletonController.removeScheduleRuleForAllVesselInstances(ruleBlockId);

        return data;
    } else {
        return "Id not available";
    }


};

const removeAll = function () {

};

const addRuleConfigReferenceRuleBlock = function (ruleBlockId, rulesArray) {
    let ruleConfigReferencesRuleBlockJsonData = RuleConfigsModel.getRuleConfigsReferencesRuleBlocksJsonData();

    for (let index in rulesArray) {
        if (!rulesArray.hasOwnProperty(index)) {
            continue;
        }

        const ruleId = rulesArray[index];

        if (ruleId) {
            handleRuleConfigReferenceRuleBlock(ruleBlockId, ruleId, ruleConfigReferencesRuleBlockJsonData);
        }
    }
    console.log(ruleConfigReferencesRuleBlockJsonData);
};

const updateRuleConfigReferenceRuleBlock = async function (updatedRuleBlockData,oldRuleBlockData) {
    const ruleConfigReferencesRuleBlockJsonData = RuleConfigsModel.getRuleConfigsReferencesRuleBlocksJsonData();
    let oldRuleConfigIds = JSON.parse(oldRuleBlockData.rules);
    if(typeof oldRuleConfigIds === "number"){
        oldRuleConfigIds = [oldRuleConfigIds];
    }
    const ruleBlockId = parseInt(Object.keys(updatedRuleBlockData)[0]);
    const ruleBlockData = Object.values(updatedRuleBlockData)[0];
    const RuleIdArr = JSON.parse(ruleBlockData.rules);

    for(let key in oldRuleConfigIds){
        let oldRuleConfigKey = oldRuleConfigIds[key];
        const result = await RuleConfigsModel.deleteRuleConfigsReferencesRuleBlocksById(oldRuleConfigKey);
        if(result>0){
            console.log("Rule Config Reference Rule Block Delete Successfully !!!");
            delete ruleConfigReferencesRuleBlockJsonData[oldRuleConfigKey];
        }else{
            return "Rule Config Reference Rule Block Not Delete Successfully !!!";
        }
    }
    for (let key in RuleIdArr) {
        const ruleId = RuleIdArr[key];

        if (ruleId) {
            handleRuleConfigReferenceRuleBlock(ruleBlockId, ruleId, ruleConfigReferencesRuleBlockJsonData);
        }
    }
    console.log(ruleConfigReferencesRuleBlockJsonData);
    return true;
};

const handleRuleConfigReferenceRuleBlock = async function (ruleBlockId, ruleId, ruleConfigReferencesRuleBlockJsonData) {
    if (!ruleConfigReferencesRuleBlockJsonData.hasOwnProperty(ruleId)) {
        ruleConfigReferencesRuleBlockJsonData[ruleId] = [];

        let ruleBlocksArray = ruleConfigReferencesRuleBlockJsonData[ruleId];
        if (!ruleBlocksArray.includes(ruleBlockId)) {
            ruleBlocksArray.push(ruleBlockId);

            const ruleConfigReferencesRuleBlockData = {
                ruleConfigId: ruleId,
                refArr: ruleBlocksArray
            };
            const result = await RuleConfigsModel.createRuleConfigsReferencesRuleBlocks(ruleConfigReferencesRuleBlockData);

            if (result > 0) {
                return "Rule Config Reference Rule Block created successfully!!!";
            } else {
                return "Error occurred while creating a Rule Config Reference Rule Block !!!";
            }
        }
    } else {
        let ruleBlocksArray = ruleConfigReferencesRuleBlockJsonData[ruleId];
        if (!ruleBlocksArray.includes(ruleBlockId)) {
            ruleBlocksArray.push(ruleBlockId);

            const result = await RuleConfigsModel.updateRuleConfigsReferencesRuleBlockById(ruleId, ruleBlocksArray);

            if (result > 0) {
                return "Rule Config Reference Rule Block updated successfully!!!";
            } else {
                return "Error occurred while updating a Rule Config Reference Rule Block!!!";
            }
        }
    }
};

const updateActivationState = async function (request) {
    const updatedRuleBlockData = request.body;
    if (!updatedRuleBlockData)
        throw new Error('Cannot update rule block due to insufficient details!');
    const result = await RuleBlocksModel.updateRuleBlockActivateStateById(updatedRuleBlockData);
    if (result) {
        let ruleBlocksJsonData = await RuleBlocksModel.getRuleBlocksJsonData();
        const keyname = Object.keys(updatedRuleBlockData)[0];
        ruleBlocksJsonData[keyname]["isActivated"] = updatedRuleBlockData[keyname]["isActivated"];
        return "Rule Block updated successfully!!!";
    } else {
        return "Error occurred while updating a Rule Block!!!";
    }

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

    addRuleConfigReferenceRuleBlock: addRuleConfigReferenceRuleBlock,
    updateRuleConfigReferenceRuleBlock: updateRuleConfigReferenceRuleBlock,
    handleRuleConfigReferenceRuleBlock: handleRuleConfigReferenceRuleBlock,

    updateActivationState: updateActivationState
};
