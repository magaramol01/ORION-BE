'use strict';

require('log-timestamp');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {UNITS} = require("../utils/tables");

let unitsJsonData = null;

exports.loadUnitsJsonDataInMemory = async function () {
    if (unitsJsonData === null) {
        unitsJsonData = await exports.getAllUnits();
    }
};

exports.getUnitsJsonData = function () {
    return unitsJsonData;
};

exports.syncUnitsJsonData = function () {
    unitsJsonData = null;
    unitsJsonData = exports.getAllUnits();
};

exports.getAllUnits = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT * FROM ${UNITS};`;

    let unitJSON = {}
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        dbResponse.rows.forEach(units => {
            const unitsId = units.id;
            delete units.id;
            unitJSON[unitsId] = units;
        });
    } else {
        console.error("Could Not Load Units Table Data");
    }
    return unitJSON;
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${UNITS}
    (
        id serial
        constraint ${UNITS}_pk
            primary key,
        label varchar,
        value varchar
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("Units Table Created")
            else
                console.error("Could Not Create Units Table");
        })
};

exports.createUnit = async function (unitsData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let rows = {};
    const insertQuery = `INSERT INTO ${UNITS} (label,value) values('${unitsData.label}','${unitsData.value}') RETURNING *;`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, null);

    if (dbResponse) {
        rows = dbResponse.rows[0];
    } else {
        console.error("Error while saving Unit::");
    }
    return rows;
};

exports.removeUnitById = async function (unitId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let rowCount;
    const deleteQuery = `DELETE FROM ${UNITS} WHERE id = ${unitId} RETURNING *;`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        rowCount = dbResponse.rowCount;
    } else {
        console.error("Error while Deleting Unit::");
    }
    return rowCount;

};