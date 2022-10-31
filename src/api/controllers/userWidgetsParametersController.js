'use strict';

const userWidgetsParametersModel = require("../models/userWidgetsParametersModel");
const AudiTrailModel = require("../models/auditTrailModel");
const {Util} = require("../utils/util");


const create = async function (request) {
    const userWidgetsParametersData = request.body;

    const userWidgetsParametersMappingData = {
        name: userWidgetsParametersData.name,
        type: userWidgetsParametersData.type,
        screen: userWidgetsParametersData.screen,
        socketId: userWidgetsParametersData.socketId,
        layout: JSON.stringify(userWidgetsParametersData.layout),
        configuration: JSON.stringify(userWidgetsParametersData.configuration),
        userId: userWidgetsParametersData.userId,
        widgetsParameterId: userWidgetsParametersData.widgetsParameterId
    };

    const result = await userWidgetsParametersModel.saveWidgetsParameters(userWidgetsParametersMappingData);

    if (result.inserted > 0) {
        const auditTrailInfo = Util.getAuditTrailInfo("create", "User Widgets Parameters Mapping", userWidgetsParametersData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        return "User Widgets Parameters Mapping created successfully!!!";
    } else {
        return "Error occurred while creating a User Widgets Parameters Mapping!!!";
    }
};

const readAll = async function () {
    return await userWidgetsParametersModel.getWidgetsParameters();
};

module.exports = {
    create: create,
    readAll: readAll,
};