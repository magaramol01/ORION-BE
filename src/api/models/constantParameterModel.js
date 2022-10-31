"use strict";

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {CONSTANT_PARAMETERS, CONSTANT_PARAMETERS_DATA, USER, SHIP, PARAMETERS}  = require("../utils/tables");

let constantParametersJsonData = null;

exports.loadConstantParametersJsonDataInMemory = async function () {
    if (constantParametersJsonData === null) {
        constantParametersJsonData = await exports.getAllConstantParameters();
    }
};

exports.getConstantParametersJsonData = function () {
    return constantParametersJsonData;
};

exports.syncConstantParametersJsonData = function () {
    constantParametersJsonData = null;
    constantParametersJsonData = exports.getAllConstantParameters();
};

exports.createConstantParameter = async function (constantParameterData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    const dbResponse = await new Promise((resolve, reject) => {
        reThinkDb.table("constantParameters")
            .insert(constantParameterData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);

                const constantParameterId = response.generated_keys[0];
                const constantParameterDataData = {
                    parameterId: constantParameterId,
                    constValue: constantParameterData.currentValueOfParameter,
                    remark: constantParameterData.remark,
                    dateTime: reThinkDb.now()
                };

                reThinkDb.table("constantParametersData")
                    .insert(constantParameterDataData)
                    .run(DataAccessAdaptor.connection, function (err, response) {
                        console.log('Data Inserted Successfully in constantParametersData table', response);
                    });

                resolve(response);
            });
    });

    return dbResponse;
};

exports.updateConstantParameterById = async function (updatedConstantParameterData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    const dbResponse = await new Promise((resolve, reject) => {
        reThinkDb.table("constantParameters").get(Object.keys(updatedConstantParameterData)[0]).update(Object.values(updatedConstantParameterData)[0])
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Updated Successfully', response);
                resolve(response);
            });
    });

    return dbResponse;
};

exports.updateConstantParameterData = async function (constantParameterData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    const constantParameterDataData = {
        parameterId: constantParameterData.ID,
        constValue: constantParameterData.currentValueOfParameter,
        remark: constantParameterData.remark,
        dateTime: reThinkDb.now()
    };

    const dbResponse = await new Promise((resolve, reject) => {
        reThinkDb.table("constantParametersData")
            .insert(constantParameterDataData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully in constantParametersData table', response);

                resolve(response);
            });
    });

    return dbResponse;
};

exports.getAllConstantParameterHistoricalDataById = async function (constantParameterId) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let constantParameterHistoricalDataJsonArr = [];
    let constantParameterHistoricalData = [];

    try {
        constantParameterHistoricalData = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('constantParametersData').filter({constantParameterId: constantParameterId})
                .run(DataAccessAdaptor.connection, function (err, cursor) {
                    if (err) {
                        throw err;
                    }
                    const constantParameterHistoricalDataArr = cursor.toArray(function (err, result) {
                        if (err) {
                            throw err;
                        }
                        // console.log(JSON.stringify(result, null, 2));
                    });
                    resolve(constantParameterHistoricalDataArr);
                });
        });

        constantParameterHistoricalData.forEach(constantParameterData => {
            constantParameterHistoricalDataJsonArr.push(constantParameterData.parameterId = constantParameterData);
        });

        return constantParameterHistoricalDataJsonArr;
    } catch (e) {
        console.log(e)
    }
};

exports.getAllConstantParameters = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let constantParametersJson = {};
    let constantParameters = [];

    try {
        constantParameters = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('constantParameters').run(DataAccessAdaptor.connection, function (err, cursor) {
                if (err) {
                    throw err;
                }
                const constantParametersArr = cursor.toArray(function (err, result) {
                    if (err) {
                        throw err;
                    }
                    // console.log(JSON.stringify(result, null, 2));
                });
                resolve(constantParametersArr) ? resolve(constantParametersArr) : [];
            });
        });


        constantParameters.forEach(constantParameter => {
            const constantParameterId = constantParameter.id;
            delete constantParameter.id;
            constantParametersJson[constantParameterId] = constantParameter;
        });

        return constantParametersJson;
    } catch (e) {
        console.log(e)
    }

};

exports.createConstantParametersTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${CONSTANT_PARAMETERS}
    (
        id serial
        constraint ${CONSTANT_PARAMETERS}_pk
            primary key,
        companyName varchar,
        currentValueOfParameter varchar,
        duration varchar,
        durationUnit varchar,
        enumeratedValue jsonb,
        isCalculatedValue boolean,
        isFixedValue boolean,
        isRealValue boolean,
        machine varchar,
        name varchar,
        normalRange jsonb,
        remark varchar,
        specifiedRange jsonb,
        unit varchar,
        userId integer
        constraint ${CONSTANT_PARAMETERS}_${USER}_id_fk
            references "${USER}",
        vesselId                integer
        constraint ${CONSTANT_PARAMETERS}_${SHIP}_id_fk
            references ${SHIP}
   );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("ConstantParameters Table Created")
            else
                console.error("Could Not Create ConstantParameters Table");
        })
};

exports.createConstantParametersDataTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${CONSTANT_PARAMETERS_DATA}
    (
        id serial
        constraint ${CONSTANT_PARAMETERS_DATA}_pk
            primary key,
        constValue  varchar,
        dateTime    timestamp,
        parameterId integer
        constraint ${CONSTANT_PARAMETERS_DATA}_${PARAMETERS}_id_fk
            references ${PARAMETERS},
        remark varchar
   );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("ConstantParametersData Table Created")
            else
                console.error("Could Not Create ConstantParametersData Table");
        })
};