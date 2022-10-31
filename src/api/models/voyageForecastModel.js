'use strict';

require('log-timestamp');

const {VOYAGE_FORECAST, SHIP} = require("../utils/tables");
const {Util} = require("../utils/util");
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");

let voyageForecastJsonData = null;

exports.loadVoyageForecastJsonDataInMemory = async function () {
    if (voyageForecastJsonData === null) {
        voyageForecastJsonData = await this.getLatestVoyageForecastData();
    }
};

exports.getVoyageForecastJsonData = function () {
    return voyageForecastJsonData;
};

exports.getVoyageForecastJsonDataByVesselId = async function (vesselId) {
    return voyageForecastJsonData[vesselId];
};

exports.syncVoyageForecastJsonData = async function () {
    voyageForecastJsonData = null;
    voyageForecastJsonData = await this.getLatestVoyageForecastData();
};

exports.getVoyageForecastData = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let voyageForecastArr = [];

    const query = `SELECT * FROM ${VOYAGE_FORECAST}`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        voyageForecastArr = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Voyage Forecast Table!!!");
    }

    return voyageForecastArr;
};

exports.getLatestVoyageForecastData = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let voyageForecastJson = {};

    // const query = `SELECT vf.id, vf.destination as "DESTINATION", vf.distancetogo as "DISTANCE_TO_GO", vf.distancetravelled as "DISTANCE_TRAVELLED",
    //             vf.draught as "DRAUGHT", vf.draughtmax as "DRAUGHT_MAX", vf.eta as "ETA", vf.etacalc as "ETA_CALC",
    //             vf.lastport as "LAST_PORT", vf.lastportid as "LAST_PORT_ID", vf.lastporttime as "LAST_PORT_TIME",
    //             vf.lastPortUnlocode as "LAST_PORT_UNLOCODE", vf.loadstatusname as "LOAD_STATUS_NAME",
    //             vf.mmsi as "MMSI", vf.nextportid as "NEXT_PORT_ID", vf.nextportname as "NEXT_PORT_NAME",
    //             vf.nextportunlocode as "NEXT_PORT_UNLOCODE", vf.route as "ROUTE", vf.speedcalc as "SPEED_CALC",
    //             to_char(vf.createdts, '${Util.getDBCommonDateTimeFormat()}') as "createdTs",
    //             vf.journeycounter as "journeyCounter", to_char(vf.packetts, '${Util.getDBCommonDateTimeFormat()}') as "packetTs",
    //             vf.vesselid as "vesselId"
    //             FROM ${VOYAGE_FORECAST} as vf
    //             INNER JOIN (SELECT vesselId, MAX(journeyCounter) AS journeyCounter
    //                 FROM ${VOYAGE_FORECAST}
    //                 GROUP BY vesselId) as groupedvf
    //             ON vf.vesselId = groupedvf.vesselId
    //             AND vf.journeyCounter = groupedvf.journeyCounter`;

    const query=`SELECT vf.id, vf.destination as "DESTINATION", vf.distancetogo as "DISTANCE_TO_GO", vf.distancetravelled as "DISTANCE_TRAVELLED",
                vf.draught as "DRAUGHT", vf.draughtmax as "DRAUGHT_MAX", vf.eta as "ETA", vf.etacalc as "ETA_CALC",
                vf.lastport as "LAST_PORT", vf.lastportid as "LAST_PORT_ID", vf.lastporttime as "LAST_PORT_TIME",
                vf.lastPortUnlocode as "LAST_PORT_UNLOCODE", vf.loadstatusname as "LOAD_STATUS_NAME",
                vf.mmsi as "MMSI", vf.nextportid as "NEXT_PORT_ID", vf.nextportname as "NEXT_PORT_NAME",
                vf.nextportunlocode as "NEXT_PORT_UNLOCODE", vf.route as "ROUTE", vf.speedcalc as "SPEED_CALC",
                to_char(vf.createdts, '${Util.getDBCommonDateTimeFormat()}') as "createdTs",
                vf.journeycounter as "journeyCounter", to_char(vf.packetts, '${Util.getDBCommonDateTimeFormat()}') as "packetTs",
                vf.vesselid as "vesselId"
                FROM ${VOYAGE_FORECAST} as vf
                where flag=true;`

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        dbResponse.rows.map(item => {
            voyageForecastJson[item.vesselId] = item;
        });
    } else {
        console.error("Error while fetching data from Voyage Forecast Table!!!");
    }

    return voyageForecastJson;
};

exports.getVoyageForecastDataByShipName = async function (shipName) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let voyageForecastArr = [];

    try {
        voyageForecastArr = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('voyageForecast')
                .filter({shipName: shipName})
                .run(DataAccessAdaptor.connection, async function (err, cursor) {
                    if (err) {
                        throw err;
                    }
                    const voyageForecastArr = await cursor.toArray(function (err, result) {
                        if (err) {
                            throw err;
                        }
                        // console.log(JSON.stringify(result, null, 2));
                    });
                    resolve(voyageForecastArr);
                });
        });

        return voyageForecastArr;
    } catch (e) {
        console.log(e)
    }
};

exports.getVoyageForecastDataByShipNameOriginal = async function (shipName, journeyCounter) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let voyageForecastArr = [];

    try {
        voyageForecastArr = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('voyageForecast')
                .filter({shipName: shipName, journeyCounter: journeyCounter})
                .run(DataAccessAdaptor.connection, async function (err, cursor) {
                    if (err) {
                        throw err;
                    }
                    const voyageForecastArr = await cursor.toArray(function (err, result) {
                        if (err) {
                            throw err;
                        }
                        // console.log(JSON.stringify(result, null, 2));
                    });
                    resolve(voyageForecastArr);
                });
        });

        return voyageForecastArr;
    } catch (e) {
        console.log(e)
    }
};

exports.insertData = async function (voyageForecastData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `INSERT INTO ` + VOYAGE_FORECAST +
        `(destination, distanceToGo, distanceTravelled, draught, draughtMax, eta, etaCalc, lastPort, lastPortId, 
        lastPortTime, lastPortUnlocode, loadStatusName, mmsi, nextPortId, nextPortName, nextPortUnlocode,
        route, speedCalc, createdTs, journeyCounter, packetTs, vesselId)
        VALUES (` + voyageForecastData.DESTINATION + `, ` +
        voyageForecastData.DISTANCE_TO_GO + `, ` +
        voyageForecastData.DISTANCE_TRAVELLED + `, ` +
        voyageForecastData.DRAUGHT + `, ` +
        voyageForecastData.DRAUGHT_MAX + `, ` +
        voyageForecastData.ETA + `, ` +
        voyageForecastData.ETA_CALC + `, ` +
        voyageForecastData.LAST_PORT + `, ` +
        voyageForecastData.LAST_PORT_ID + `, ` +
        voyageForecastData.LAST_PORT_TIME + `, ` +
        voyageForecastData.LAST_PORT_UNLOCODE + `, ` +
        voyageForecastData.LOAD_STATUS_NAME + `, ` +
        voyageForecastData.MMSI + `, ` +
        voyageForecastData.NEXT_PORT_ID + `, ` +
        voyageForecastData.NEXT_PORT_NAME + `, ` +
        voyageForecastData.NEXT_PORT_UNLOCODE + `, ` +
        voyageForecastData.ROUTE + `, ` +
        voyageForecastData.SPEED_CALC + `, ` +
        voyageForecastData.createdTs + `, ` +
        voyageForecastData.journeyCounter + `, ` +
        voyageForecastData.packetTs + `, ` +
        voyageForecastData.vesselId + `) ` +
        `RETURNING *;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log('Data Inserted Successfully');
    } else {
        console.error("Error while inserting data into Voyage Forecast Table!!!");
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${VOYAGE_FORECAST}
    (
        id serial
        constraint ${VOYAGE_FORECAST}_pk
            primary key,
        destination varchar,
        distanceToGo numeric,
        distanceTravelled numeric,
        draught numeric,
        draughtMax numeric,
        eta timestamp,
        etaCalc timestamp,
        lastPort varchar,
        lastPortId varchar,
        lastPortTime timestamp,
        lastPortUnlocode varchar,
        loadStatusName varchar,
        mmsi varchar,
        nextPortId varchar,
        nextPortName varchar,
        nextPortUnlocode varchar,
        route varchar,
        speedCalc numeric,
        createdTs timestamp,
        journeyCounter integer,
        packetTs timestamp,
        response varchar,
        username varchar,
        flag boolean,
        res_timestamp timestamp,
        vesselId integer
            constraint ${VOYAGE_FORECAST}_${SHIP}_id_fk
                references ${SHIP}
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("Voyage Forecast Table created successfully!!!");
    } else {
        console.error("Error while creating Voyage Forecast Table!!!");
    }
};