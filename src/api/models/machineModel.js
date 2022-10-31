'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {MACHINES}  = require("../utils/tables");

let machineJsonData = null;

exports.loadMachineJsonDataInMemory = async function () {
    if (machineJsonData === null) {
        machineJsonData = await exports.getAllMachines();
    }
};

exports.getMachinesJsonData = function () {
    return machineJsonData;
};

exports.getAllMachines = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT * FROM ${MACHINES};`;

    let machineJSON = {};
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        dbResponse.rows.forEach(machine => {
            const machineId = machine.id;
            delete machine.id;
            machineJSON[machineId] = machine;
        });
    } else {
        console.error("Could Not Load Machine Table Data");
    }
    return machineJSON;
};

exports.createMachine = async function (machinesData){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let rowCount;
    const insertQuery = `INSERT INTO ${MACHINES} (label,value) values('${machinesData.label}','${machinesData.value}') RETURNING *;`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, null);

    if (dbResponse) {
        rowCount = dbResponse.rows;
    } else {
        console.error("Error while saving Machine::");
    }
    return rowCount;
};

exports.removeUnitById = async function (machineId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let rowCount;
    const deleteQuery = `DELETE FROM ${MACHINES} WHERE id = ${machineId};`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        rowCount = dbResponse.rowCount;
    } else {
        console.error("Error while Deleting Machine::");
    }
    return rowCount;
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${MACHINES}
    (
        id serial
        constraint ${MACHINES}_pk
            primary key,
        label varchar,
        value varchar
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("Machines Table Created")
            else
                console.error("Could Not Create Machines Table");
        })
};