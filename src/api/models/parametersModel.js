'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const parameterScalingMapper = require("../mappers/parameterScalingMapper");
const {PARAMETERS, PARAMETERS_REFERENCES_RULE_CONFIG, USER, SHIP}  = require("../utils/tables");

let parametersJsonData = null;
let parametersReferencesRuleConfigJsonData = null;
let {Util} = require("../utils/util");

exports.loadParametersJsonDataInMemory = async function () {
    if (parametersJsonData == null) {
        parametersJsonData = await exports.getAllParameters();
        await parameterScalingMapper.syncParameterScalingFromParameters();
    }
};

exports.getParametersJsonData = function () {
    return parametersJsonData;
};

exports.syncParametersJsonData = async function () {
    parametersJsonData = null;
    await exports.loadParametersJsonDataInMemory();
};

exports.loadParametersReferencesRuleConfigJsonDataInMemory = async function () {
    if (parametersReferencesRuleConfigJsonData === null) {
        parametersReferencesRuleConfigJsonData = await exports.getAllParametersReferencesRuleConfig();
    }
};

exports.getParametersReferencesRuleConfigJsonData = function () {
    return parametersReferencesRuleConfigJsonData;
};

exports.syncParametersReferencesRuleConfigJsonData = function () {
    parametersReferencesRuleConfigJsonData = null;
    parametersReferencesRuleConfigJsonData = exports.getAllParametersReferencesRuleConfig();
};

exports.getAllParameters = async function () {
    if(!Util)
        Util = require("../utils/util").Util;

    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id, companyName as "companyName", description as "description", enumeratedValue as "enumeratedValue", 
    isCalculatedValue as "isCalculatedValue", isFixedValue as "isFixedValue", isRealValue as "isRealValue",machine as "machine", name as "name", normalRange as "normalRange", 
    precision as "precision", rtdasMapping as "rtdasMapping", scale as "scale", specifiedRange as "specifiedRange", unit as "unit", userId as "userId", vesselId as "vesselId" from ${PARAMETERS};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All Parameters Data from parameters Table");
        let parametersJson = {};
        for (let i =0 ; i< dbResponse.rows.length ; i++) {
            let records = dbResponse.rows[i];
            let key = records["id"];
            // delete records["id"];
            parametersJson[key] = records;
        }
        return parametersJson;
    } else {
        console.error("Error Occurred While fetching data from FailureAdvisory Table");
        return {};
    }
};

exports.createParameter = async function (parameterData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${PARAMETERS}
    (companyName, description, enumeratedValue, isCalculatedValue, isFixedValue, isRealValue, machine, name, normalRange, precision, rtdasMapping, scale, specifiedRange
    , unit, userId, vesselId)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id;`;

    const values = [
        parameterData.companyName, parameterData.description, parameterData.enumeratedValue , parameterData.isCalculatedValue,parameterData.isFixedValue , parameterData.isRealValue ,parameterData.machine,
        parameterData.name, parameterData.normalRange ,parameterData.precision ,parameterData.rtdasMapping,parameterData.scale,parameterData.specifiedRange,
        parameterData.unit,parameterData.userId,parameterData.vesselId
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("parameter Inserted In parameters Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting parameter Record In parameters Table");
    }
};

exports.updateParameterById = async function (updatedParameterData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const id = Object.keys(updatedParameterData)[0];

    const updateQuery = `UPDATE ${PARAMETERS} SET companyName = $1, name = $2, description = $3, unit = $4, machine = $5 ,precision= $6, isrealvalue = $7,
     isfixedvalue = $8, iscalculatedvalue = $9, rtdasmapping =$10, specifiedrange =$11, normalrange= $12,
        enumeratedvalue = $13, scale = $14, vesselid =$15 where id = $16;`;

    const values = [updatedParameterData[id].companyName,
        updatedParameterData[id].name,
        updatedParameterData[id].description,
        updatedParameterData[id].unit,
        updatedParameterData[id].machine,
        updatedParameterData[id].precision,
        updatedParameterData[id].isRealValue,
        updatedParameterData[id].isFixedValue,
        updatedParameterData[id].isCalculatedValue,
        updatedParameterData[id].rtdasMapping,
        updatedParameterData[id].specifiedRange,
        updatedParameterData[id].normalRange,
        updatedParameterData[id].enumeratedValue,
        updatedParameterData[id].scale,
        updatedParameterData[id].vesselId,
        parseInt(id)]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("Updated ParameterId from parameter Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating parameterId from parameter Table");
        return false;
    }
};

exports.deleteParameterById = async function (parameterId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${PARAMETERS} where id = ${parameterId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting Parameter Data By ID from Parameters Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Deleting Parameter Data By ID from Parameters Table");
        return false;
    }
};

exports.createTable = async function (){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${PARAMETERS}
    (
        id serial
        constraint ${PARAMETERS}_pk
            primary key,
        companyName varchar,
        description varchar,
        enumeratedValue jsonb,
        isCalculatedValue boolean,
        isFixedValue boolean,
        isRealValue boolean,
        machine varchar,
        name varchar,
        normalRange jsonb,
        precision varchar,
        rtdasMapping varchar,
        scale numeric,
        specifiedRange jsonb,
        unit varchar,
        userId integer
        constraint ${PARAMETERS}_${USER}_id_fk
            references "${USER}",
        vesselId integer
        constraint ${PARAMETERS}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("Parameters Table Created")
            else
                console.error("Could Not Create Parameters Table");
        })
};

exports.insertData = async function (dataAccessAdaptor) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    // const DataAccessAdaptor = dataAccessAdaptor;
    const reThinkDb = DataAccessAdaptor.getDBReference();

    await new Promise((resolve, reject) => {
        const parametersData = {
            "name": "T237",
            "description": "2to3*C is normal change range; 5to8*C is alarm rate change",
            "unit": "°C",
            "precision": "",
            "isRealValue": "true",
            "isFixedValue": "false",
            "isCalculatedValue": "false",
            "rtdasMapping": "mysql-func-name",
            "specifiedRange": {
                "isSpecifiedRange": true,
                "isRange": true,
                "range": {
                    "from": "-50",
                    "to": "100"
                },
                "isSingleValue": false,
                "singleValue": {
                    "value": ""
                },
                "isCalculatedExpression": false,
                "calculatedExpression": {
                    "expression": "",
                    "expressionDetails": ""
                }
            },
            "normalRange": {
                "isNormalRange": true,
                "isRange": false,
                "range": {
                    "from": "",
                    "to": ""
                },
                "isSingleValue": true,
                "singleValue": {
                    "value": "50"
                },
                "isCalculatedExpression": false,
                "calculatedExpression": {
                    "expression": "",
                    "expressionDetails": ""
                }
            },
            "enumeratedValue": {
                "isEnumeratedValue": false,
                "values": []
            }
        };
        reThinkDb.table("parameters")
            .insert(parametersData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
            });
    });
};

exports.getAllParametersReferencesRuleConfig = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id, parameterid as "parameterId", refarr as "refArr" from ${PARAMETERS_REFERENCES_RULE_CONFIG};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All ParametersReferencesRuleConfig Data from ParametersReferencesRuleConfig Table")

        const parametersReferencesRuleConfigJson = {};
        dbResponse.rows.map(parameterReferencesRuleConfig => {
            parametersReferencesRuleConfigJson[parameterReferencesRuleConfig.parameterId] = parameterReferencesRuleConfig.refArr;
        });
        return parametersReferencesRuleConfigJson;
    } else {
        console.error("Error Occurred While fetching ParametersReferencesRuleConfig from ParametersReferencesRuleConfig Table");
        return {};
    }
};

exports.createParameterReferencesRuleConfig = async function (parameterReferencesRuleConfigData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const insertQuery = `INSERT INTO ${PARAMETERS_REFERENCES_RULE_CONFIG} (parameterid, refarr)
     VALUES($1, $2);`
    const values = [parameterReferencesRuleConfigData.parameterId, JSON.stringify(parameterReferencesRuleConfigData.refArr)];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if(dbResponse){
        console.log("Inserted ParameterReferencesRuleConfigData In ParametersReferencesRuleConfig Table");
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error Occurred While Inserting ParameterReferencesRuleConfigData In ParametersReferencesRuleConfig Table");
        return false;
    }
};

exports.updateParameterReferencesRuleConfigById = async function (parameterId, ruleConfigsArray) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const updateQuery = `UPDATE ${PARAMETERS_REFERENCES_RULE_CONFIG} SET refarr = $1 where parameterid = $2;`;

    const values = [JSON.stringify(ruleConfigsArray), parameterId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("Updated ParameterReferencesRuleConfigById from ParametersReferencesRuleConfig Table")
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error Occurred While Updating ParameterReferencesRuleConfigById from ParametersReferencesRuleConfig Table");
        return false;
    }
};

exports.deleteParameterReferencesRuleConfigById = async function (refName) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${PARAMETERS_REFERENCES_RULE_CONFIG} where parameterid = ${refName};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting ParameterReferencesRuleConfigById from ParametersReferencesRuleConfig Table")
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error Occurred While Deleting ParameterReferencesRuleConfigById from ParametersReferencesRuleConfig Table");
        return false;
    }
};

exports.createParametersReferencesRuleConfigTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${PARAMETERS_REFERENCES_RULE_CONFIG}
    (
        id serial
        constraint ${PARAMETERS_REFERENCES_RULE_CONFIG}_pk
            primary key,
        parameterId integer
        constraint ${PARAMETERS_REFERENCES_RULE_CONFIG}_${PARAMETERS}_id_fk
            references ${PARAMETERS},
        refArr jsonb
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("ParametersReferencesRuleConfig Table Created")
            else
                console.error("Could Not Create ParametersReferencesRuleConfig Table");
        })
};

exports.insertDataParametersReferencesRuleConfig = async function (dataAccessAdaptor) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    // const DataAccessAdaptor = dataAccessAdaptor;
    const reThinkDb = DataAccessAdaptor.getDBReference();

    await new Promise((resolve, reject) => {
        const parametersReferencesRuleConfigData = {
            T237: [
                "R1",
                "R2",
                "R30"
            ]
        };
        reThinkDb.table("parametersReferencesRuleConfig")
            .insert(parametersReferencesRuleConfigData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
            });
    });
};