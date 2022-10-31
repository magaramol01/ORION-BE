'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {VESSEL_JOURNEY_COUNTER, SHIP} = require("../utils/tables");

let vesselJourneyCounterJsonData = null;

exports.loadVesselJourneyCounterJsonDataInMemory = async function () {
    if (vesselJourneyCounterJsonData === null) {
        vesselJourneyCounterJsonData = await exports.fetchVesselJourneyCounterJsonData();
    }
};

exports.getVesselJourneyCounterJsonData = function () {
    return vesselJourneyCounterJsonData;
};

exports.syncVesselJourneyCounterJsonData = async function () {
    vesselJourneyCounterJsonData = null;
    vesselJourneyCounterJsonData = await exports.fetchVesselJourneyCounterJsonData();
};

exports.getVesselJourneyCounterByVesselId = function (vesselId) {
    return vesselJourneyCounterJsonData[vesselId];
};

exports.fetchVesselJourneyCounterJsonData = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let vesselJourneyCounterJson = {};

    const query = `SELECT * FROM ${VESSEL_JOURNEY_COUNTER}`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        dbResponse.rows.forEach(vesselJourneyCounters => {
            delete vesselJourneyCounters.id;
            vesselJourneyCounterJson[vesselJourneyCounters.vesselid] = vesselJourneyCounters.journeycounter;
        });
    } else {
        console.error("Error while fetching data from Vessel Journey Counter Table!!!");
    }

    return vesselJourneyCounterJson;
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${VESSEL_JOURNEY_COUNTER}
    (
        id serial
        constraint ${VESSEL_JOURNEY_COUNTER}_pk
            primary key,
        journeyCounter integer,
        vesselId integer
            constraint ${VESSEL_JOURNEY_COUNTER}_${SHIP}_id_fk
                references ${SHIP}
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("Vessel Journey Counter Table created successfully!!!");
    } else {
        console.error("Error while creating Vessel Journey Counter Table!!!");
    }
};

exports.insertData = async function (vesselJourneyCounterData) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${VESSEL_JOURNEY_COUNTER}` +
        `(journeyCounter, vesselId) VALUES (` +
        vesselJourneyCounterData.journeyCounter + `, ` +
        vesselJourneyCounterData.vesselId + `)` +
        ` RETURNING *;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log('Data Inserted Successfully in Vessel Journey Counter!!!');
    } else {
        console.error("Error while inserting data into Vessel Journey Counter Table!!!");
    }
};

exports.updateCounterByVesselId = async function (vesselId, journeyCounter) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `UPDATE ${VESSEL_JOURNEY_COUNTER}` +
        ` SET journeycounter = ` + journeyCounter +
        ` WHERE vesselid = ` + vesselId;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log('Data updated Successfully in Vessel Journey Counter!!!');
    } else {
        console.error("Error while updating data into Vessel Journey Counter Table!!!");
    }
};