'use strict';

require('log-timestamp');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");

let parameterSourcesJsonData = null;

exports.loadParameterSourcesJsonDataInMemory = async function () {
    if (parameterSourcesJsonData === null) {
        parameterSourcesJsonData = await exports.getAllParameterSources();
    }
};

exports.getParameterSourcesJsonData = function () {
    return parameterSourcesJsonData;
};

exports.syncParameterSourceJsonData = function () {
    parameterSourcesJsonData = null;
    parameterSourcesJsonData = exports.getAllParameterSources();
};

exports.getAllParameterSources = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let parameterSourcesJson = {};
    let parameterSources = [];

    try {
        parameterSources = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('parameterSource').run(DataAccessAdaptor.connection, function (err, cursor) {
                if (err) {
                    throw err;
                }
                const parameterSourcesArr = cursor.toArray(function (err, result) {
                    if (err) {
                        throw err;
                    }
                    // console.log(JSON.stringify(result, null, 2));
                });
                resolve(parameterSourcesArr);
            });
        });

        parameterSources.forEach(parameterSource => {
            const parameterSourceId = parameterSource.id;
            delete parameterSource.id;
            parameterSourcesJson[parameterSourceId] = parameterSource;
        });

        return parameterSourcesJson;
    } catch (e) {
        console.log(e)
    }
};

exports.createParameterSource = async function (parameterSourceData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    const dbResponse = await new Promise((resolve, reject) => {
        reThinkDb.table("parameterSource")
            .insert(parameterSourceData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
                resolve(response);
            });
    });

    return dbResponse;
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    await new Promise((resolve, reject) => {
        DataAccessAdaptor.reThinkDb.tableCreate("parameterSource").run(DataAccessAdaptor.connection, function (err, result) {
            if (err) {
                console.log("Error while creating Parameter Sources Table :: ", err);
                throw err;
            }
            console.log(result);
        });
    });
};

