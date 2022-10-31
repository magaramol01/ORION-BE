'use strict';

/*
* CRUD CONTROLLER
* */

const AudiTrailModel = require("../models/auditTrailModel");
const UnitsModel = require("../models/unitsModel");
const {Util} = require("../utils/util");

const create = async function (request) {
    const unitsData = request.body;
    let response = {};

    if (!unitsData)
        throw new Error('Cannot store empty units!');

    let unitsJsonData = await UnitsModel.getUnitsJsonData();

    for(let item of Object.values(unitsJsonData)){
        if(item.label === unitsData.label){
            return {
                status: false,
                id: 0
            }
        }
    }

    const result = await UnitsModel.createUnit(unitsData);

    if (result.id) {
        const unitKey = result.id;
        unitsJsonData[unitKey] = unitsData;

        const auditTrailInfo = Util.getAuditTrailInfo("create", "Units", unitsData.label);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        response = {
            status: true,
            id: unitKey
        }
    } else {
        response = {
            status: false,
            id: -1
        }
    }
    return response;
};

const removeById = async function (request) {
    let unitId = request.query.id;
    if(unitId){
        const result= await UnitsModel.removeUnitById(unitId);
        if(result > 0){
            const unitsJsonData = await UnitsModel.getUnitsJsonData();
            const auditTrailInfo = Util.getAuditTrailInfo("delete", "Units", unitsJsonData[unitId].label);
            AudiTrailModel.saveAuditTrail({
                userId: request.session.user.id,
                ipAddress: request.ip,
                action: auditTrailInfo.actionMsg,
                description: auditTrailInfo.descMsg
            });
            delete unitsJsonData[unitId];
        }
    }
};

const readAll = async function () {
    return await UnitsModel.getUnitsJsonData();
};

module.exports = {
    create: create,
    readAll: readAll,
    removeById: removeById
};
