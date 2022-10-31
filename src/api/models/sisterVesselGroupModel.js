'use strict';

require('log-timestamp');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {SISTER_VESSEL_GROUP} = require("../utils/tables");

exports.createVesselGroup = async function (vesselData) {

     const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
     let rows = {};
     const insertQuery = `INSERT INTO ${SISTER_VESSEL_GROUP} (vesselgroupname,description) values('${vesselData.groupname}','${vesselData.description}') RETURNING *;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, null);

    if (dbResponse) {
        rows = dbResponse.rows[0];
    } else {
        console.error("Error while saving Unit::");
    }
    return rows;
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${SISTER_VESSEL_GROUP}
    (
        id serial
        constraint ${SISTER_VESSEL_GROUP}_pk
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


exports.getAllSisterGroups = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT * FROM ${SISTER_VESSEL_GROUP};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Could Not Load Units Table Data");
    }
};

exports.getByID = async function (Id) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT * FROM ${SISTER_VESSEL_GROUP} where id = ${id};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Could Not Load Units Table Data");
    }

};

exports.getJsonData= async function (Id)
{

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT * FROM ${SISTER_VESSEL_GROUP};`;
    console.log(query);

    let unitJSON = {};
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        dbResponse.rows.forEach(units =>
        {
            const unitsId = units.id;
            delete units.id;
            unitJSON[unitsId] = units;
        });
        return unitJSON;
    } else {
        console.error("Could Not Load Units Table Data");
    }

};

exports.removeSisterVesselById = async function (Id) {
   const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${SISTER_VESSEL_GROUP} where id = ${Id} RETURNING id, vesselgroupname as "name"`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting Sister Ship Group By ID from Ship Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deleting Sister Ship Groupa By ID ");
        return {};
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${SISTER_VESSEL_GROUP}
    (
        id serial
        constraint ${SISTER_VESSEL_GROUP}_pk
            primary key,
        vesselgroupname varchar,
        description text
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("sistervesselgroup Table Created")
            else
                console.error("Could Not Create sistervesselgroup Table");
        })
};