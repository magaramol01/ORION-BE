'use strict';

require('log-timestamp');
const dateFormat = require('dateformat');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {Util} = require("../utils/util");
const {EU_PORTS} = require("../utils/tables");

let euPortsMap = new Map();

exports.getAllEUPorts = function () {
    return euPortsMap;
};

exports.fetchAllEUPorts = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let euPorts = [];

    const query = `SELECT * FROM ${EU_PORTS}`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        euPorts = dbResponse.rows;
    } else {
        console.error("Error while fetching data from EU Ports Table!!!");
    }

    return euPorts;
};

exports.loadEUPortsDataInMemory = async function () {
    if (euPortsMap.size <= 0) {
        const euPortsArr = await exports.fetchAllEUPorts();
        const euPortsArrLength = euPortsArr.length;
        for (let i = 0; i < euPortsArrLength; i++) {
            const euPort = euPortsArr[i];
            const country = euPort.country;
            const port = euPort.port;

            if (!euPortsMap.has(country)) {
                euPortsMap.set(country, [port]);
            } else {
                const existingArr = euPortsMap.get(country);
                existingArr.push(port);
                euPortsMap.set(country, existingArr);
            }
        }
    }
};

exports.syncAllEUPorts = async function () {
    euPortsMap = new Map();
    exports.loadEUPortsDataInMemory();
};

exports.uploadEUPorts = function (euPortData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${EU_PORTS} ` +
        ` (country, port) VALUES (` +
        `$1, $2) ` +
        ` RETURNING *;`;
    const values = [euPortData.Country, euPortData.Port];

    DataAccessAdaptor.executeQueryAsync(query, values);
};

exports.saveEUPort = async function (auditTrail) {

};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${EU_PORTS}
    (
        id serial
        constraint ${EU_PORTS}_pk
            primary key,
        country varchar,
        port varchar
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("EU Ports Table created successfully!!!");
    } else {
        console.error("Error while creating EU Ports Table!!!");
    }
};