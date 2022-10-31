'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {RULE_CONFIGS, RULE_CONFIGS_REFERENCES_RULE_BLOCKS, USER, SHIP, PARAMETERS}  = require("../utils/tables");

let ruleConfigsJsonData = null;
let ruleConfigsReferencesRuleBlocksJsonData = null;

exports.loadRuleConfigsJsonDataInMemory = async function () {
    if (ruleConfigsJsonData === null) {
        ruleConfigsJsonData = await exports.getAllRuleConfigs();
    }
};

exports.getRuleConfigsJsonData = function () {
    return ruleConfigsJsonData;
};

exports.syncRuleConfigsJsonData = async function () {
    ruleConfigsJsonData = null;
    ruleConfigsJsonData = await exports.getAllRuleConfigs();
};

exports.loadRuleConfigsReferencesRuleBlocksJsonDataInMemory = async function () {
    if (ruleConfigsReferencesRuleBlocksJsonData === null) {
        ruleConfigsReferencesRuleBlocksJsonData = await exports.getAllRuleConfigsReferencesRuleBlocks();
    }
};

exports.getRuleConfigsReferencesRuleBlocksJsonData = function () {
    return ruleConfigsReferencesRuleBlocksJsonData;
};

exports.syncRuleConfigsReferencesRuleBlocksJsonData = function () {
    ruleConfigsReferencesRuleBlocksJsonData = null;
    ruleConfigsReferencesRuleBlocksJsonData = exports.getAllRuleConfigsReferencesRuleBlocks();
};

exports.getAllRuleConfigs = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id, condition, description, unit, companyname as "companyName", enumeratedvalue as "enumeratedValue",
      isactive as "isActive", parameterid as "parameterId", rulename as "ruleName", userid as "userId", vesselid as "vesselId" from ${RULE_CONFIGS};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All RuleConfigs Data from RuleConfigs Table")
        let ruleConfigsObject = {};
        dbResponse.rows.map(item =>{
            ruleConfigsObject[item.id] = item;
        })
        return ruleConfigsObject;
    } else {
        console.error("Error Occurred While fetching RuleConfigs Data from RuleConfigs Table");
        return {};
    }
};

exports.createRuleConfig = async function (ruleConfigsData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${RULE_CONFIGS} (companyname, condition, description, enumeratedvalue, isactive, rulename, unit,
     parameterid, userid, vesselid )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;`;

    const values = [
        ruleConfigsData.companyName, ruleConfigsData.condition, ruleConfigsData.description, ruleConfigsData.enumeratedValue,
        ruleConfigsData.isActive, ruleConfigsData.ruleName, ruleConfigsData.unit, ruleConfigsData.parameterId,
        ruleConfigsData.userId, ruleConfigsData.vesselId
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("Inserted RuleConfigs Data In RuleConfigs Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting RuleConfigs Data In RuleConfigs Table");
        return false;
    }
};

exports.updateRuleConfigById = async function (updatedRuleConfigData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `UPDATE ${RULE_CONFIGS} SET companyname = $1, condition = $2, description = $3, enumeratedvalue = $4,
        isactive = $5, parameterid = $6, rulename = $7, unit = $8, userid = $9, vesselid = $10 where id = $11 RETURNING id;`;

    const values = [
        updatedRuleConfigData.companyName, updatedRuleConfigData.condition, updatedRuleConfigData.description,
        updatedRuleConfigData.enumeratedValue, updatedRuleConfigData.isActive, updatedRuleConfigData.parameterId,
        updatedRuleConfigData.ruleName, updatedRuleConfigData.unit, updatedRuleConfigData.userId,
        updatedRuleConfigData.vesselId, updatedRuleConfigData.id
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("Updated RuleConfigById In RuleConfigs Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Updating RuleConfigById In RuleConfigs Table");
        return false;
    }
};

exports.deleteRuleConfigById = async function (ruleConfigId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${RULE_CONFIGS} where id = ${ruleConfigId} RETURNING id;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting RuleConfig By ID from RuleConfigs Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deleting RuleConfig By ID from RuleConfigs Table");
        return false;
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${RULE_CONFIGS}
    (
        id serial
        constraint ${RULE_CONFIGS}_pk
            primary key,
        companyName varchar,
        condition jsonb,
        description varchar,
        enumeratedValue jsonb,
        isActive boolean,
        parameterId integer
        constraint ${RULE_CONFIGS}_${PARAMETERS}_id_fk
            references ${PARAMETERS},
        ruleName varchar,
        unit varchar,
        userId integer
        constraint ${RULE_CONFIGS}_${USER}_id_fk
            references "${USER}",
        vesselId integer
        constraint ${RULE_CONFIGS}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("RuleConfigs Table Created")
            else
                console.error("Could Not Create RuleConfigs Table");
        })
};

exports.insertData = async function (dataAccessAdaptor) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    // const DataAccessAdaptor = dataAccessAdaptor;
    const reThinkDb = DataAccessAdaptor.getDBReference();

    await new Promise((resolve, reject) => {
        const ruleConfigsData = {
            "ruleName": "T237 Specified range",
            "parameterId": "T237",
            "description": "specified range",
            "isActive": true,
            "unit": "degree celsius",
            "condition": {
                "isRange": true,
                "range": {
                    "from": "-50",
                    "fromOperator": "<=",
                    "to": "100",
                    "toOperator": ">="
                },
                "isSingleValue": false,
                "singleValue": {
                    "value": "50",
                    "valueOperator": ">="
                },
                "isCalculatedExpression": false,
                "calculatedExpression": {
                    "expression": "",
                    "expressionDetails": ""
                },
                "isEnumeratedValue": false
            },
            "enumeratedValue": {
                "isEnumeratedValue": false,
                "values": []
            }
        };
        reThinkDb.table("ruleConfigs")
            .insert(ruleConfigsData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
            });
    });
};

exports.getAllRuleConfigsReferencesRuleBlocks = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let ruleConfigsReferencesRuleBlocksJson = {};

    const selectQuery = `SELECT * from ${RULE_CONFIGS_REFERENCES_RULE_BLOCKS};`;

    const ruleConfigsReferencesRuleBlocks = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (ruleConfigsReferencesRuleBlocks) {
        console.log("Fetched All Data from RULE_CONFIGS_REFERENCES_RULE_BLOCKS Table")

        ruleConfigsReferencesRuleBlocks.rows.forEach(ruleConfigReferencesRuleBlock => {
            ruleConfigsReferencesRuleBlocksJson[ruleConfigReferencesRuleBlock.ruleconfigid] = ruleConfigReferencesRuleBlock.refarr;
        });
    } else
        console.error("Error Occurred While fetching All Data from RULE_CONFIGS_REFERENCES_RULE_BLOCKS Table");
    return ruleConfigsReferencesRuleBlocksJson;
};

exports.createRuleConfigsReferencesRuleBlocks = async function (ruleConfigReferencesRuleBlocksData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${RULE_CONFIGS_REFERENCES_RULE_BLOCKS}
    (refarr, ruleconfigid)
      VALUES($1, $2) RETURNING *;`;

    const values = [JSON.stringify(ruleConfigReferencesRuleBlocksData.refArr), ruleConfigReferencesRuleBlocksData.ruleConfigId];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("RULE_CONFIGS_REFERENCES_RULE_BLOCKS Record Inserted In RULE_CONFIGS_REFERENCES_RULE_BLOCKS Table");
        return dbResponse.rowCount;
    } else {
        console.error("Error Occurred While Inserting RULE_CONFIGS_REFERENCES_RULE_BLOCKS Record In RULE_CONFIGS_REFERENCES_RULE_BLOCKS Table");
        return false;
    }
};

exports.updateRuleConfigsReferencesRuleBlockById = async function (ruleConfigId, ruleBlockssArray) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `UPDATE ${RULE_CONFIGS_REFERENCES_RULE_BLOCKS} SET refarr = $1 WHERE ruleconfigid = $2;`;

    const values = [JSON.stringify(ruleBlockssArray), ruleConfigId]
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("RULE_CONFIGS_REFERENCES_RULE_BLOCKS Record UPDATED In RULE_CONFIGS_REFERENCES_RULE_BLOCKS Table");
        return dbResponse.rowCount;
    } else {
        console.error("Error Occurred While UPDATING RULE_CONFIGS_REFERENCES_RULE_BLOCKS Record In RULE_CONFIGS_REFERENCES_RULE_BLOCKS Table");
        return false;
    }
};

exports.deleteRuleConfigsReferencesRuleBlocksById = async function (key) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${RULE_CONFIGS_REFERENCES_RULE_BLOCKS} where ruleconfigid = $1;`;

    const values = [key]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, values);

    if (dbResponse) {
        console.log("Deleting RULE_CONFIGS_REFERENCES_RULE_BLOCKS Data By ruleconfigid")
        return dbResponse.rowCount;
    } else {
        console.error("Error Occurred While Deleting RULE_CONFIGS_REFERENCES_RULE_BLOCKS Data By ruleconfigid");
        return false;
    }

};

exports.createRuleConfigsReferencesRuleBlocksTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${RULE_CONFIGS_REFERENCES_RULE_BLOCKS}
    (
        id serial
        constraint ${RULE_CONFIGS_REFERENCES_RULE_BLOCKS}_pk
            primary key,
        refArr jsonb,
        ruleConfigId integer
        constraint ${RULE_CONFIGS_REFERENCES_RULE_BLOCKS}_${RULE_CONFIGS}_id_fk
            references ${RULE_CONFIGS}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("RuleConfigsReferencesRuleBlocks Table Created")
            else
                console.error("Could Not Create RuleConfigsReferencesRuleBlocks Table");
        })
};

exports.insertDataRuleConfigsReferencesRuleBlocks = async function (dataAccessAdaptor) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    // const DataAccessAdaptor = dataAccessAdaptor;
    const reThinkDb = DataAccessAdaptor.getDBReference();

    await new Promise((resolve, reject) => {
        const ruleConfigsData = {
            R1: [
                "RB1",
                "RB2"
            ]
        };
        reThinkDb.table("ruleConfigsReferencesRuleBlocks")
            .insert(ruleConfigsData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
            });
    });
};