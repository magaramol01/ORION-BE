'use strict';

/*
* CRUD CONTROLLER
* */
const AudiTrailModel = require("../models/auditTrailModel");

const create = function (request) {
    return AudiTrailModel.saveAuditTrail(request.body);
};

const readById = async function (request) {
    return await AudiTrailModel.getAuditTrailById(request.query.auditTrailId);
};

const readAll = async function () {
    return await AudiTrailModel.getAllAuditTrail();
};

const update = async function (request) {
    const auditTrail = {};
    return await AudiTrailModel.updateAuditTrail(auditTrail);
};

const removeById = async function (request) {
    const auditTrailId = request.query.auditTrailId;
    return await AudiTrailModel.deleteAuditTrailById(auditTrailId);
};

const removeAll = function (request) {

};

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    update: update,
    removeById: removeById,
    removeAll: removeAll
};