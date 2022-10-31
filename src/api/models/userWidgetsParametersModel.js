'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");


exports.getCountByUserAndSocketId = async function (UserId="",SocketId="") {

    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let userWidgetsParameters = [];

    try {
        userWidgetsParameters = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('userWidgetsParameters')
                .filter({"userId":UserId,"socketId":SocketId})
                .count()
                .run(DataAccessAdaptor.connection, function (err, cursor) {
                    if (err) {
                        throw err;
                    }
                    resolve(cursor);
                });
        });
        return userWidgetsParameters;
    } catch (e) {
        console.log(e)
    }
};

exports.getWidgetsParametersByUserAndSocketId = async function (UserId="",SocketId="") {

    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let userWidgetsParametersJson = {};
    let userWidgetsParameters = [];

    try {
        userWidgetsParameters = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('userWidgetsParameters')
                .filter({"userId":UserId,"socketId":SocketId})
                .run(DataAccessAdaptor.connection, function (err, cursor) {
                    if (err) {
                        throw err;
                    }
                    const userWidgetsParametersArr = cursor.toArray(function (err, result) {
                        if (err) {
                            throw err;
                        }
                        // console.log(JSON.stringify(result, null, 2));
                    });
                    resolve(userWidgetsParametersArr);
                });
        });

        userWidgetsParameters.forEach(userWidgetsParameters => {
            const widgetId = userWidgetsParameters.id;
            delete userWidgetsParameters.id;
            userWidgetsParameters.layout = JSON.parse(userWidgetsParameters.layout);
            userWidgetsParameters.configuration = JSON.parse(userWidgetsParameters.configuration);
            userWidgetsParametersJson[widgetId] = userWidgetsParameters;
        });

        return userWidgetsParametersJson;
    } catch (e) {
        console.log(e)
    }
};

exports.getWidgetsParameters = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let userWidgetsParametersJson = {};
    let userWidgetsParameters = [];

    try {
        userWidgetsParameters = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('userWidgetsParameters').run(DataAccessAdaptor.connection, function (err, cursor) {
                if (err) {
                    throw err;
                }
                const userWidgetsParametersArr = cursor.toArray(function (err, result) {
                    if (err) {
                        throw err;
                    }
                    // console.log(JSON.stringify(result, null, 2));
                });
                resolve(userWidgetsParametersArr);
            });
        });

        userWidgetsParameters.forEach(userWidgetsParameters => {
            const widgetId = userWidgetsParameters.id;
            delete userWidgetsParameters.id;
            userWidgetsParameters.layout = JSON.parse(userWidgetsParameters.layout);
            userWidgetsParameters.configuration = JSON.parse(userWidgetsParameters.configuration);
            userWidgetsParametersJson[widgetId] = userWidgetsParameters;
        });

        return userWidgetsParametersJson;
    } catch (e) {
        console.log(e)
    }
};

exports.saveWidgetsParameters = async function (widgetsParametersMappingData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    return await new Promise((resolve, reject) => {
        DataAccessAdaptor.reThinkDb.table("userWidgetsParameters")
            .insert(widgetsParametersMappingData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
                resolve(response);
            });
    });
};

exports.createTable = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    await new Promise((resolve, reject) => {
        DataAccessAdaptor.reThinkDb.tableCreate("userWidgetsParameters").run(DataAccessAdaptor.connection, function (err, result) {
            if (err) {
                console.log("Error while creating userWidgetsParameters Table :: ", err);
                throw err;
            }
            console.log(result);
        });
    });
};
