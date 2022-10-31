'use strict';

require('log-timestamp');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {FLEET} = require("../utils/tables");

exports.createFleet = async function (fleetData) {

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let rows = {};
    const insertQuery = `INSERT INTO ${FLEET} (name,description) values('${fleetData.fleetname}','${fleetData.description}') RETURNING *;`;
     console.log(insertQuery);

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, null);

    if (dbResponse) {
        rows = dbResponse.rows[0];
    } else {
        console.error("Error while saving Unit::");
    }
    return rows;
};



exports.getAllFleetData = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT * FROM ${FLEET};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Could Not Load Fleet Table Data");
    }
};


exports.getJsonData = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT * FROM ${FLEET};`;

    let unitJSON = {};
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        dbResponse.rows.forEach(units => {
            const unitsId = units.id;
            delete units.id;
            unitJSON[unitsId] = units;
        });
        return unitJSON;

    } else {
        console.error("Could Not Load Fleet Table Data");
    }
};

exports.removefleetById = async function (Id) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${FLEET} where id = ${Id} RETURNING id, name as "name";`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting fleet Group By ID from Group Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deleting fleet  By ID ");
        return {};
    }
};


exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${FLEET}
    (
        id serial
        constraint ${FLEET}_pk
            primary key,
        name varchar,
        description varchar
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("Fleet Table Created")
            else
                console.error("Could Not Create Fleet Table");
        })
};
