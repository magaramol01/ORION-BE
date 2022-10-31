'use strict';

require('log-timestamp');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {CALCULATED_EXPRESSION}  = require("../utils/tables");

let calculatedExpressionJsonData = null;

exports.loadCalculatedExpressionJsonDataInMemory = async function () {
    if (calculatedExpressionJsonData === null) {
        calculatedExpressionJsonData = await exports.getAllCalculatedExpressions();
    }
};

exports.getCalculatedExpressionJsonData = function () {
    return calculatedExpressionJsonData;
};

exports.syncCalculatedExpressionSourceJsonData = function () {
    calculatedExpressionJsonData = null;
    calculatedExpressionJsonData = exports.getAllCalculatedExpressions();
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${CALCULATED_EXPRESSION}
    (
        id serial
        constraint ${CALCULATED_EXPRESSION}_pk
            primary key,
        description varchar,
        expression varchar,
        name varchar
   );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("CalculatedExpression Table Created")
            else
                console.error("Could Not Create CalculatedExpression Table");
        })
};

exports.getAllCalculatedExpressions = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let calculatedExpressionJson = {};
    let calculatedExpression = [];

    try {
        calculatedExpression = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('calculatedExpression').run(DataAccessAdaptor.connection, function(err, cursor) {
                if (err) {
                    throw err;
                }
                const causesArr = cursor.toArray(function(err, result) {
                    if (err) {
                        throw err;
                    }
                    // console.log(JSON.stringify(result, null, 2));
                });
                resolve(causesArr);
            });
        });


        calculatedExpression.forEach(calculatedExpression => {
            const causeId = calculatedExpression.id;
            delete calculatedExpression.id;
            calculatedExpressionJson[causeId] = calculatedExpression;
        });

        return calculatedExpressionJson;
    } catch (e) {
        console.log(e)
    }
};

exports.createCalculatedExpression = async function (calculatedExpressionData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    const dbResponse = await new Promise((resolve, reject) => {
        reThinkDb.table("calculatedExpression")
            .insert(calculatedExpressionData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
                resolve(response);
            });
    });

    return dbResponse;
};

exports.updateCalculatedExpressionById = async function (updatedCalculatedExpressionData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    const dbResponse = await new Promise((resolve, reject) => {
        reThinkDb.table("calculatedExpression").get(Object.keys(updatedCalculatedExpressionData)[0]).update(Object.values(updatedCalculatedExpressionData)[0])
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Updated Successfully', response);
                resolve(response);
            });
    });

    return dbResponse;
};