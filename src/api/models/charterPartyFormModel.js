'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
let {GraphUnitData} = require("../controllers/graphUnitData");
const {CHARTER_PARTY_FORM_DATA}  = require("../utils/tables");

let charterJson = {};

exports.loadCharterDataInMemory = async function () {
    const latestCharterData = await exports.getLatestCharterPartyData();

    if (!GraphUnitData) {
        GraphUnitData = require("../controllers/graphUnitData");
    }
    if(latestCharterData) {
        charterJson = {};

        for(let i =0;i<latestCharterData.length;i++){
            charterJson[latestCharterData[i].vesselid] = {
                fueldata : latestCharterData[i].fueldata,
                speeddata : latestCharterData[i].speeddata,
                vesselid : latestCharterData[i].vesselid,
                timestamp : latestCharterData[i].timestamp
            }
        }
        GraphUnitData.getInstance().setCharterDataFromDB(charterJson);
    }
};

exports.getLatestCharterData = function () {
    return charterJson;
};

exports.createTable = async function (){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${CHARTER_PARTY_FORM_DATA}
    (
         id serial
        constraint ${CHARTER_PARTY_FORM_DATA}_pk
            primary key,
        fuelData numeric,
        speedData numeric,
        vesselId integer,
        timestamp timestamp
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("CharterPartyFormData Table Created")
            else
                console.error("Could Not Create CharterPartyFormData Table");
        })
};

exports.getAllData = async function () {

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT vesselid as "vesselId", fueldata as "fuelData", speeddata as "speedData" from ${CHARTER_PARTY_FORM_DATA};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All Data from Charter Party Form Data Table");
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching data from Charter Party Form Data Table");
        return [];
    }
};

exports.getLatestCharterPartyData = async function () {

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT o.* FROM ${CHARTER_PARTY_FORM_DATA}  o LEFT JOIN ${CHARTER_PARTY_FORM_DATA}  b ON o.vesselid = b.vesselid AND o.timestamp < b.timestamp WHERE b.vesselid is NULL;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching data from Charter Party Form Data Table");
        return false;
    }
};

exports.insertData = async function (charterFormData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const insertQuery = `INSERT INTO ${CHARTER_PARTY_FORM_DATA}
    (fueldata ,speedData, vesselid, timestamp) values($1,$2,$3,$4) RETURNING *`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery,
        [
            charterFormData.fuelData,
            charterFormData.speedData,
            charterFormData.vesselId,
            charterFormData.timestamp
        ]);

    if (dbResponse) {
        if (!GraphUnitData) {
            GraphUnitData = require("../controllers/graphUnitData");
        }
        charterJson[charterFormData.vesselId] = {
            fueldata : dbResponse.rows[0].fueldata,
            speeddata : dbResponse.rows[0].speeddata,
            vesselid : dbResponse.rows[0].vesselid,
            timestamp : dbResponse.rows[0].timestamp
        }
        GraphUnitData.getInstance().setCharterDataFromDB(charterJson);
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error while saving CHARTER PARTY FORM DATA");
        return false;
    }
};

exports.updateData = async function (charterFormData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const insertQuery = `UPDATE ${CHARTER_PARTY_FORM_DATA} 
    set fueldata = $1, speeddata = $2 where vesselid = $3;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery,
        [
            charterFormData.fuelData,
            charterFormData.speedData,
            charterFormData.vesselId
        ]);

    if (dbResponse) {
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error while saving CHARTER PARTY FORM DATA");
        return false;
    }
};