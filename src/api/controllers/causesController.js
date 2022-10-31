'use strict';

/*
* CRUD CONTROLLER
* */

const AudiTrailModel = require("../models/auditTrailModel");
const CausesModel = require("../models/causesModel");
const FailureAdvisoryModel = require("../models/failureAdvisoriesModel");
const ShipModel = require("../models/shipModel");
const {Util} = require("../utils/util");
const _ = require('lodash');

const create = async function (request) {
    const data = request.body;
    if (!data)
        throw new Error('Cannot store empty cause!');

    const causesJsonData = await CausesModel.getCausesJsonData();
    if (Object.values(causesJsonData).includes(data.name)) {
        return "Cause name already exists!!!"
    }

    const causeData = {
        name: data.name,
        companyName: request.session.user.CompanyName,
        description: data.description,
        userId: request.session.user.id,
        vesselId: ShipModel.getShipIdByMappingName(data.vesselName)
    }

    const result = await CausesModel.createCause(causeData);

    if (result.id) {
        causeData.id = result.id;
        causesJsonData[causeData.id] = causeData;

        const auditTrailInfo = Util.getAuditTrailInfo("create", "Cause", causeData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        return causeData.id;
    } else {
        return "Error occurred while creating a Cause!!!";
    }

};

const readById = function (causeId) {
    let cause = {};
    cause[causeId] = CausesModel.getCausesJsonData()[causeId];
    return cause;
};

const readAll = async function (request) {
    const causesJsonData = await CausesModel.getCausesJsonData();
    return causesJsonData;
};

const readAllByShip = async function (request) {
    const causesJsonData = await CausesModel.getCausesJsonData();
    const vesselName = request.query.vesselName;
    let causesJsonDataCopy = _.cloneDeep(causesJsonData);
    let causesJsonDataFilterByVessel = Util.filterRecordsByVesselId(causesJsonDataCopy,ShipModel.getShipIdByMappingName(vesselName));
    return causesJsonDataFilterByVessel;
};

const readAllByShipForPagination = async function (request) {
    const {
        vesselName,
        activePage,
        sortBy,
        searchArr
    } = request.query;
    const causesJsonData = CausesModel.getCausesJsonData();

    return Util.filterRecordsByVesselIdForPagination(
        _.orderBy(_.cloneDeep(causesJsonData), ['name'], [sortBy]),
        ShipModel.getShipIdByMappingName(vesselName),
        activePage,
        JSON.parse(searchArr)
    );
};

const update = async function (request) {
    const data = request.body;

    if (!data)
        throw new Error('Cannot update cause due to insufficient details!');

    const causeId = parseInt(Object.keys(data)[0]);

    const causeData = {
        id: causeId,
        name: data[causeId].name,
        companyName: request.session.user.CompanyName,
        description: data[causeId].description,
        userId: request.session.user.id,
        vesselId: ShipModel.getShipIdByMappingName(data[causeId].vesselName)
    }

    const result = await CausesModel.updateCauseById(causeData);

    if (result) {
        const causesJsonData =  CausesModel.getCausesJsonData();
        causesJsonData[causeId] = causeData;

        const auditTrailInfo = Util.getAuditTrailInfo("update", "Cause", causeData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        return "Cause updated successfully!!!";
    } else {
        return "Error occurred while updating a Cause!!!";
    }

};

const removeById = async function (causeId) {
    const causesJsonData = await CausesModel.getCausesJsonData();

    const causesReferencesRuleConfigJsonData = await CausesModel.getCausesReferencesRuleConfigJsonData();
    const failureAdvisoriesReferencesCausesJsonData = await FailureAdvisoryModel.getFailureAdvisoriesReferencesCausesJsonData();

    for (let configKey in failureAdvisoriesReferencesCausesJsonData) {
        if (!failureAdvisoriesReferencesCausesJsonData.hasOwnProperty(configKey)) {
            continue;
        }

        const firstObject = failureAdvisoriesReferencesCausesJsonData[configKey];
        for (let faKey in firstObject) {
            let finalCausesList = firstObject[faKey];
            for (let finalKey in finalCausesList) {
                if (finalCausesList[finalKey].includes(causeId)) {
                    return "already in used.";
                }
            }
        }
    }

    if (causesJsonData && causesJsonData.hasOwnProperty(causeId)) {
        const result = await CausesModel.deleteCauseById(causeId);
        let data;
        if(result){
            data = delete causesJsonData[causeId];
        }

        if (causesReferencesRuleConfigJsonData && causesReferencesRuleConfigJsonData.hasOwnProperty(causeId)) {
            const result = await CausesModel.deleteCausesReferencesRuleConfigById(causeId);
            if(result){
                delete causesReferencesRuleConfigJsonData[causeId];
                console.log("CausesReferencesRuleConfig Delete Successfully!!!");
            }else{
                console.log("CausesReferencesRuleConfig not Delete!!!")
            }
        }

        return data;
    } else {
        return "Id not available";
    }
};

const removeAll = function () {

};

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    readAllByShip: readAllByShip,
    readAllByShipForPagination: readAllByShipForPagination,
    update: update,
    removeById: removeById,
    removeAll: removeAll
};
