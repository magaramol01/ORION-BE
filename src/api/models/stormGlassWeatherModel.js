'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {Util} = require("../utils/util");
const {STORM_GLASS_WEATHER, SHIP} = require("../utils/tables");

exports.getWeatherData = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let weatherDataArr = [];
    const query = `SELECT to_char(packetTs, '${Util.getDBCommonDateTimeFormat()}') as packetTs, ` +
        ` to_char(createdTs, '${Util.getDBCommonDateTimeFormat()}') as createdTs, ` +
        ` id, journeyCounter, lat, long, weatherData, nmeaData, vesselId FROM ` + STORM_GLASS_WEATHER;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        weatherDataArr = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Storm Glass Weather Table!!!");
    }
    return weatherDataArr;
};

exports.getWeatherDataByVesselId = async function (vesselId) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let weatherDataArr = [];
    const query = `SELECT to_char(packetTs, '${Util.getDBCommonDateTimeFormat()}') as packetTs, ` +
        ` to_char(createdTs, '${Util.getDBCommonDateTimeFormat()}') as createdTs, ` +
        ` id, journeyCounter, lat, long, weatherData, nmeaData, vesselId FROM ` + STORM_GLASS_WEATHER +
        ` WHERE vesselId = ` + vesselId +
        ` ORDER BY packetTs ASC`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        weatherDataArr = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Storm Glass Weather Table!!!");
    }
    return weatherDataArr;
};

exports.getWeatherDataByVesselIdAndJourneyCounter = async function (vesselId, journeyCounter) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let weatherDataArr = [];
    const query = `SELECT to_char(packetTs, '${Util.getDBCommonDateTimeFormat()}') as packetTs, ` +
        ` to_char(createdTs, '${Util.getDBCommonDateTimeFormat()}') as createdTs, ` +
        ` id, journeyCounter, lat, long, weatherData, nmeaData, vesselId FROM ` + STORM_GLASS_WEATHER +
        ` WHERE vesselId = ` + vesselId + ` AND journeyCounter = ` + journeyCounter +
        ` ORDER BY packetTs ASC`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        weatherDataArr = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Storm Glass Weather Table!!!");
    }
    return weatherDataArr;
};

exports.getWeatherDataByVesselIdAndJourneyCounterWithVesselId = async function (vesselId, journeyCounter) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let weatherDataArr = [];
    const query = `SELECT to_char(packetTs, '${Util.getDBCommonDateTimeFormat()}') as "packetTs", ` +
        ` to_char(createdTs, '${Util.getDBCommonDateTimeFormat()}') as "createdTs", ` +
        ` id, journeycounter as "journeyCounter", lat, long, weatherdata as "weatherData", nmeadata as "nmeaData", ` +
        ` vesselid as "vesselId" ` +
        ` FROM ` + STORM_GLASS_WEATHER +
        ` WHERE vesselId = ` + vesselId + ` AND journeyCounter = ` + journeyCounter +
        ` ORDER BY packetTs ASC`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        weatherDataArr = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Storm Glass Weather Table!!!");
    }
    return weatherDataArr;
};

exports.getAllVesselsLatestWeatherData = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `SELECT to_char(sgw.packetTs, '${Util.getDBCommonDateTimeFormat()}') as "packetTs", ` +
        ` to_char(sgw.createdTs, '${Util.getDBCommonDateTimeFormat()}') as "createdTs", ` +
        ` sgw.id, sgw.journeycounter as "journeyCounter", sgw.lat, sgw.long, sgw.weatherdata as "weatherData", sgw.nmeadata as "nmeaData", ` +
        ` sgw.vesselid as "vesselId" ` +
    ` FROM ` + STORM_GLASS_WEATHER + ` sgw 
    LEFT JOIN ` + STORM_GLASS_WEATHER + ` b
        ON sgw.vesselid = b.vesselid
        AND sgw.packetts < b.packetts
    WHERE b.packetts IS NULL`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error while fetching all vessels latest Storm Glass Weather data from table " + STORM_GLASS_WEATHER + " !!!");
    }

    return [];
};

exports.insertData = async function (weatherData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const insertQuery = `INSERT INTO ` + STORM_GLASS_WEATHER +
        ` (createdTs, journeyCounter, lat, long, weatherData, nmeaData, packetTs, vesselId)` +
        ` VALUES (` +
        `TO_TIMESTAMP('` + weatherData.createdTs + `', '${Util.getDBCommonDateTimeFormat()}'), ` +
        weatherData.journeyCounter + `, ` +
        weatherData.lat + `, ` +
        weatherData.long + `, ` +
        `'` + weatherData.weatherData + `', ` +
        `'` + weatherData.nmeaData + `', ` +
        `TO_TIMESTAMP('` + weatherData.packetTs + `', '${Util.getDBCommonDateTimeFormat()}'), ` +
        weatherData.vesselId + `) ` +
        ` RETURNING *;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, null);
    if (dbResponse) {
        console.log('Data Inserted Successfully in stormGlassWeather table !');
    } else {
        console.error("Error while inserting data into Storm Glass Weather Table!!!");
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${STORM_GLASS_WEATHER}
    (
        id serial
            constraint ${STORM_GLASS_WEATHER}_pk
                primary key,
        createdTs timestamp,
        journeyCounter integer,
        lat numeric,
        long numeric,
        weatherData jsonb,
        nmeaData jsonb,
        packetTs timestamp,
        vesselId integer
            constraint ${STORM_GLASS_WEATHER}_${SHIP}_id_fk
                references ${SHIP}
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("Storm Glass Weather Table created successfully!!!");
    } else {
        console.error("Error while creating Storm Glass Weather Table!!!");
    }
};