'use strict';

/*
* CRUD CONTROLLER
* */

const _ = require('lodash');
const AudiTrailModel = require("../models/auditTrailModel");
const MachineModel = require("../models/machineModel");
const {Util} = require("../utils/util");

const create = async function (request) {
    const machineData = request.body;

    if (!machineData)
        throw new Error('Cannot Store Empty Machine');

    const machineJsonData = MachineModel.getMachinesJsonData();

    const result = await MachineModel.createMachine(machineData);

    if(result.length > 0 ) {
        const machineKey = result[0].id;
        machineJsonData[machineKey] = machineData;
        const auditTrailInfo = Util.getAuditTrailInfo("create","Machine", machineData.label);

        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        console.log("Machine Created Successfully");
        return machineKey;
    } else {
        return "Error Occurred While Creating a Machine!";
    }
};


const removeById = async function (request) {
    let machineId = request.query.id;
    if(machineId){
        const result = await MachineModel.removeUnitById(machineId);
        if(result > 0){
            const machineJsonData = await MachineModel.getMachinesJsonData();
            const auditTrailInfo = Util.getAuditTrailInfo("delete", "Machine", machineJsonData[machineId].label);
            AudiTrailModel.saveAuditTrail({
                userId: request.session.user.id,
                ipAddress: request.ip,
                action: auditTrailInfo.actionMsg,
                description: auditTrailInfo.descMsg
            });
            delete machineJsonData[machineId];
            return machineJsonData;
        }
    }
};

const readAll = async function () {
    return await MachineModel.getMachinesJsonData();
};

const machinesForAlert = async function () {
    let machines = [];
    const machinesJson = _.cloneDeep(MachineModel.getMachinesJsonData());
    Object.values(machinesJson).forEach(machine => {
        delete machine.id;
        machines.push(machine);
    });

    return machines;
};

module.exports = {
    create: create,
    readAll: readAll,
    removeById: removeById,
    machinesForAlert: machinesForAlert
};