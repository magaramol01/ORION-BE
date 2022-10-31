'use strict';

/*
* CRUD CONTROLLER
* */

const AudiTrailModel = require("../models/auditTrailModel");
const FailureAdvisoriesModel = require("../models/failureAdvisoriesModel");
const causesModel = require("../models/causesModel");
const ruleBlocksModel = require("../models/ruleBlocksModel");
const ruleConfigsModel = require("../models/ruleConfigsModel");
const {Util} = require("../utils/util");
const _ = require('lodash');
const ShipModel = require('../models/shipModel');

const create = async function (request) {
    const failureAdvisoryData = request.body;

    if (!failureAdvisoryData)
        throw new Error('Cannot store empty failure advisory!');

    const failureAdvisoryJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    if (Object.values(failureAdvisoryJsonData).includes(failureAdvisoryData.name)) {
        return "Failure Advisory name already exists!!!"
    }

    failureAdvisoryData['userId']=request.session.user.id;
    failureAdvisoryData['companyName']=request.session.user.CompanyName;
    failureAdvisoryData['vesselId']= ShipModel.getShipIdByMappingName(failureAdvisoryData["vesselName"]);
    const result = await FailureAdvisoriesModel.createFailureAdvisory(failureAdvisoryData);

     if (result.id) {
         const failureAdvisoryKey = result.id;
         failureAdvisoryData["id"] = result.id;
         failureAdvisoryJsonData[failureAdvisoryKey] = failureAdvisoryData;

        const auditTrailInfo = Util.getAuditTrailInfo("create", failureAdvisoryJsonData.isFailureAdvisory ? "Failure Advisory" : "Alarm", failureAdvisoryJsonData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

         console.log("Failure Advisory created successfully!!!");
         return failureAdvisoryKey;
     } else {
        return "Error occurred while creating a Failure Advisory!!!";
    }

};

const readById = function (failureAdvisoryId) {
    let failureAdvisory = {};
    failureAdvisory[failureAdvisoryId] = FailureAdvisoriesModel.getFailureAdvisoriesJsonData()[failureAdvisoryId];
    return failureAdvisory;
};

const readAll = async function (request) {
    const FailureAdvisoriesJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    //let FailureAdvisoriesJsonDataCopy=_.cloneDeep(FailureAdvisoriesJsonData);
    //return Util.processAllData(request,FailureAdvisoriesJsonDataCopy);
    //return Util.sortedDataBasedOnUser(FailureAdvisoriesJsonDataCopy,request.session.user.id);
    return FailureAdvisoriesJsonData;
};

const readAllByShip = async function (request) {
    const FailureAdvisoriesJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    const vesselName = request.query.vesselName;
    let FailureAdvisoriesJsonDataCopy = _.cloneDeep(FailureAdvisoriesJsonData);
    let FailureAdvisoriesFilterByVessel = Util.filterRecordsByVesselId(FailureAdvisoriesJsonDataCopy, ShipModel.getShipIdByMappingName(vesselName));
    return Util.filterRecordsByVesselIdForPagination(_.sortBy(_.cloneDeep(failureAdvisoriesJsonData), 'name'), ShipModel.getShipIdByMappingName(vesselName), activePage);
};

const readAllByShipForPagination = async function (request) {
    const {
        vesselName,
        activePage,
        sortBy,
        searchArr
    } = request.query;
    const failureAdvisoriesJsonData = FailureAdvisoriesModel.getFailureAdvisoriesJsonData();

    return Util.filterRecordsByVesselIdForPagination(
        _.orderBy(_.cloneDeep(failureAdvisoriesJsonData), ['name'], [sortBy]),
        ShipModel.getShipIdByMappingName(vesselName),
        activePage,
        JSON.parse(searchArr)
    );
};

const getAllShipData = async function (request) {
    let shipData = [];
    const failureAdvisoriesReferenceCausesJsonData = await FailureAdvisoriesModel.getAllFailureAdvisoriesReferencesCauses();
    const failureAdvisoriesJsonData = await FailureAdvisoriesModel.getAllFailureAdvisories();
    const causeJsonData = await causesModel.getAllCauses();
    const causesReferenceRuleConfig = await causesModel.getCausesReferencesRuleConfig();
    const ruleBlockData = await ruleBlocksModel.getAllRuleBlocks();
    const ruleConfigsData = await ruleConfigsModel.getAllRuleConfigs();
    for(let key in failureAdvisoriesReferenceCausesJsonData){
        let demo = {};
        let failureAdvisoryKey = Object.keys(failureAdvisoriesReferenceCausesJsonData[key])[0];
        let failureAdvisoryName = failureAdvisoriesJsonData[failureAdvisoryKey].name;
        demo['advisory'] = failureAdvisoryName;
        let causesKeyArr = Object.values(failureAdvisoriesReferenceCausesJsonData[key])[0];
        let causesNameArr = [];
        for(let i=0;i<causesKeyArr.length;i++){
            causesNameArr.push(causeJsonData[causesKeyArr[i].replace("(","").replace(")","")].name);
        }
        demo['causes'] = causesNameArr;
        let RuleBlockKey = causesReferenceRuleConfig[causesKeyArr[0].replace("(","").replace(")","")][key][failureAdvisoryKey];
        let ruleBlockArr = RuleBlockKey.replace('(',"").replace(')',"").split('||');
        let ruleBlockNameArr = [];
        let ruleConfKeyArr = [];
        let ruleConfNameArr = [];
        for(let i=0;i<ruleBlockArr.length;i++){
            ruleBlockNameArr.push(ruleBlockData[ruleBlockArr[i]].name);
            for(let j=0;j<ruleBlockData[ruleBlockArr[i]].rules.length;j++){
                ruleConfKeyArr.push(ruleBlockData[ruleBlockArr[i]].rules[j]);
            }
        }
        demo['ruleBlock'] = ruleBlockNameArr;
        for(let i=0;i<ruleConfKeyArr.length;i++){
            ruleConfNameArr.push(ruleConfigsData[ruleConfKeyArr[i]].ruleName);
        }
        demo['ruleconfig']=ruleConfNameArr;
        console.log(demo);
        shipData.push(demo);
    }
    return shipData;
};

const update = async function (request) {
    const updatedFailureAdvisoryData = request.body;

    if (!updatedFailureAdvisoryData)
        throw new Error('Cannot update failure advisory due to insufficient details!');

    updatedFailureAdvisoryData[Object.keys(updatedFailureAdvisoryData)[0]]['userId']=request.session.user.id;
    updatedFailureAdvisoryData[Object.keys(updatedFailureAdvisoryData)[0]]['companyName']=request.session.user.CompanyName;
    let vesselName = updatedFailureAdvisoryData[Object.keys(updatedFailureAdvisoryData)[0]]['vesselName'];
    updatedFailureAdvisoryData[Object.keys(updatedFailureAdvisoryData)[0]]["vesselId"] = ShipModel.getShipIdByMappingName(vesselName);
    const result = await FailureAdvisoriesModel.updateFailureAdvisoryById(updatedFailureAdvisoryData);

    if (result) {
        const failureAdvisoriesJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
        const id = Object.keys(updatedFailureAdvisoryData)[0];
        updatedFailureAdvisoryData[id].id = id;
        failureAdvisoriesJsonData[id] = Object.values(updatedFailureAdvisoryData)[0];

        const auditTrailInfo = Util.getAuditTrailInfo("update", updatedFailureAdvisoryData.isFailureAdvisory ? "Failure Advisory" : "Alarm", Object.values(updatedFailureAdvisoryData)[0].name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        return "Failure Advisory updated successfully!!!";
    } else {
        return "Error occurred while updating a Failure Advisory!!!";
    }

};

const removeById = async function (advisoryId) {
    const failureAdvisoriesJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    const failureAdvisoriesReferencesCausesJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesReferencesCausesJsonData();

    for(let configKey in failureAdvisoriesReferencesCausesJsonData){
        if(failureAdvisoriesReferencesCausesJsonData[configKey].hasOwnProperty(advisoryId))
            return "already in used.";
    }

    if(failureAdvisoriesJsonData.hasOwnProperty(advisoryId)){
        const result = await FailureAdvisoriesModel.deleteFailureAdvisoryById(advisoryId);
        if(result){
            return delete failureAdvisoriesJsonData[advisoryId];
        }else{
            return "Failure Advosory not delete";
        }
    } else {
        return "Id not available";
    }

};

const removeAll = function () {

};

const removeOutcomeById = async (outcomeId) => {
    const failureAdvisoriesReferencesCausesJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesReferencesCausesJsonData();
    const causesReferencesRuleConfigJsonData = await causesModel.getCausesReferencesRuleConfigJsonData();

    if (failureAdvisoriesReferencesCausesJsonData.hasOwnProperty(outcomeId)) {
        const result = await FailureAdvisoriesModel.removeAdvisoriesReferencesCausesById(outcomeId);
        const AdvisoryId = Object.keys(failureAdvisoriesReferencesCausesJsonData[outcomeId])[0];
        const causesArray = failureAdvisoriesReferencesCausesJsonData.hasOwnProperty(outcomeId) ? failureAdvisoriesReferencesCausesJsonData[outcomeId][AdvisoryId] : [];
        let data;
        if(result){
            console.log("Failure Advisory Reference Causes Delete Successfully!!!");
            data = delete failureAdvisoriesReferencesCausesJsonData[outcomeId];
        }else{
            return "Error Occured!!!";
        }
        for(let key in causesArray){
            if(causesReferencesRuleConfigJsonData.hasOwnProperty(causesArray[key].replace("(","").replace(")",""))){
                const result = await causesModel.deleteCausesReferencesRuleConfigById(causesArray[key].replace("(","").replace(")",""));
                if(result){
                    delete causesReferencesRuleConfigJsonData[causesArray[key].replace("(","").replace(")","")];
                    console.log("CausesReferencesRuleConfig Delete Successfully!!!");
                }else{
                    console.log("CausesReferencesRuleConfig not Delete!!!")
                }
            }
        }
        return data;
    }else {
        return "Id not available";
    }

};

const setResetEmailForFailureAdvisoriesRefCause = async function (request) {
    let body = request.body;
    try {
        let inputData = JSON.parse(JSON.stringify(body));
        if (inputData.length) {
            const result = await FailureAdvisoriesModel.setResetEmailForFailureAdvisoriesRefCause(inputData);
            if (result) {
                return {status:'success',message:"Update set auto email for advisory and cause success"};
            } else {
                return {status:'failed',message:"Update set auto email for advisory and cause failed"};
            }
        }
    } catch (e) {
        return {status:'failed',message:"Update set auto email for advisory and cause failed no input found"};
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
    removeOutcomeById: removeOutcomeById,
    removeAll: removeAll,
    getAllShipData:getAllShipData,
    setResetEmailForFailureAdvisoriesRefCause:setResetEmailForFailureAdvisoriesRefCause
};
