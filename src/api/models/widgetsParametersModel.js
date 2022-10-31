'use strict';

require('log-timestamp');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");

let widgetsParametersJsonData = null;

exports.loadWidgetsParametersJsonDataInMemory = async function () {
    if (widgetsParametersJsonData === null) {
        widgetsParametersJsonData = await exports.getWidgetsParameters();
    }
};

exports.getWidgetsParametersJsonData = function () {
    return widgetsParametersJsonData;
};

exports.syncWidgetsParametersJsonData = function () {
    widgetsParametersJsonData = null;
    widgetsParametersJsonData = exports.getWidgetsParameters();
};

exports.getWidgetsParametersBySocketId = async function (SocketId="") {

    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let widgetsParametersJson = {};
    let widgetsParameters = [];

    try {
        widgetsParameters = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('widgetsParameters')
                .filter({"socketId":SocketId})
                .run(DataAccessAdaptor.connection, function (err, cursor) {
                if (err) {
                    throw err;
                }
                const widgetsParametersArr = cursor.toArray(function (err, result) {
                    if (err) {
                        throw err;
                    }
                    // console.log(JSON.stringify(result, null, 2));
                });
                resolve(widgetsParametersArr);
            });
        });

        widgetsParameters.forEach(widgetParameters => {
            const widgetId = widgetParameters.id;
            delete widgetParameters.id;
            widgetParameters.layout = JSON.parse(widgetParameters.layout);
            widgetParameters.configuration = JSON.parse(widgetParameters.configuration);
            widgetsParametersJson[widgetId] = widgetParameters;
        });

        return widgetsParametersJson;
    } catch (e) {
        console.log(e)
    }
};

exports.getWidgetsParameters = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let widgetsParametersJson = {};
    let widgetsParameters = [];

    try {
        widgetsParameters = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('widgetsParameters').run(DataAccessAdaptor.connection, function (err, cursor) {
                if (err) {
                    throw err;
                }
                const widgetsParametersArr = cursor.toArray(function (err, result) {
                    if (err) {
                        throw err;
                    }
                    // console.log(JSON.stringify(result, null, 2));
                });
                resolve(widgetsParametersArr);
            });
        });

        widgetsParameters.forEach(widgetParameters => {
            const widgetId = widgetParameters.id;
            delete widgetParameters.id;
            widgetParameters.layout = JSON.parse(widgetParameters.layout);
            widgetParameters.configuration = JSON.parse(widgetParameters.configuration);
            widgetsParametersJson[widgetId] = widgetParameters;
        });

        return widgetsParametersJson;
    } catch (e) {
        console.log(e)
    }
};

exports.getWidgetParametersById = function (widgetId) {
    return getWidgetsParametersJsonData()[widgetId];
};

exports.saveWidgetsParameters = async function (widgetsParametersMappingData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    return await new Promise((resolve, reject) => {
        DataAccessAdaptor.reThinkDb.table("widgetsParameters")
            .insert(widgetsParametersMappingData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
                resolve(response);
            });
    });
};

exports.createTable = async function (dataAccessAdaptor) {
    let DataAccessAdaptor = dataAccessAdaptor;

    await new Promise((resolve, reject) => {
        DataAccessAdaptor.reThinkDb.tableCreate("widgetsParameters").run(DataAccessAdaptor.connection, function (err, result) {
            if (err) {
                console.log("Error while creating widgetsParameters Table :: ", err);
            } else {
                console.log(result);
            }
        });
    });
};
