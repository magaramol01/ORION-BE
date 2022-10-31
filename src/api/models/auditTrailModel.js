'use strict';

require('log-timestamp');
const dateFormat = require('dateformat');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {Util} = require("../utils/util");
const {AUDIT_TRAIL, USER} = require("../utils/tables");

exports.getAllAuditTrail = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let auditTrails = [];

    const query = `SELECT to_char(timestamp, '` + Util.getDBCommonDateTimeFormat() + `') as timestamp, ` +
        ` action, description, ipaddress as ipAddress, userid as userId ` +
        ` FROM ${AUDIT_TRAIL}`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        auditTrails = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Audit Trail Table!!!");
    }

    return auditTrails;
};

exports.getAuditTrailById = async function (auditTrailId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let auditTrail = [];

    const query = `SELECT to_char(timestamp, '` + Util.getDBCommonDateTimeFormat() + `') as timestamp, ` +
        ` action, description, ipaddress as ipAddress, userid as userId ` +
        ` FROM ${AUDIT_TRAIL} WHERE id = $1`;
    const values = [auditTrailId];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        auditTrail = dbResponse.rows;
    } else {
        console.error("Error while fetching data from by id Audit Trail Table!!!");
    }

    return auditTrail;
};

exports.saveAuditTrail = function (auditTrail) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const timestamp = dateFormat(Util.getNewDate(), Util.getCommonDateFormat());

    const query = `INSERT INTO ${AUDIT_TRAIL}` +
        `(action, description, ipaddress, timestamp, userid) VALUES (` +
        `$1, $2, $3, $4, $5)` +
        ` RETURNING *;`;
    const values = [auditTrail.action, auditTrail.description, auditTrail.ipAddress, timestamp, auditTrail.userId];

    DataAccessAdaptor.executeQueryAsync(query, values);
};

exports.updateAuditTrail = async function (auditTrail) {

};

exports.deleteAuditTrailById = async function (auditTrailId) {

};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${AUDIT_TRAIL}
    (
        id serial
        constraint ${AUDIT_TRAIL}_pk
            primary key,
        action varchar,
        description varchar,
        ipAddress varchar,
        timestamp timestamp,
        userId integer
        constraint ${AUDIT_TRAIL}_${USER}_id_fk
            references "${USER}"
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("Audit Trail Table created successfully!!!");
    } else {
        console.error("Error while creating Audit Trail Table!!!");
    }
};