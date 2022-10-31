'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {RULE_BLOCKS, USER, SHIP}  = require("../utils/tables");
const {getCausesReferencesRuleConfig} = require("../models/causesModel");
const ruleBlocksController = require('../controllers/ruleBlocksController');

let ruleBlocksJsonData = null;
let ruleBlockReferenceCauseJsonData = null;

exports.loadRuleBlocksJsonDataInMemory = async function () {
    if (ruleBlocksJsonData === null) {
        ruleBlocksJsonData = await exports.getAllRuleBlocks();
    }
};

exports.getRuleBlocksJsonData = function () {
    return ruleBlocksJsonData;
};

exports.loadRuleBlockReferenceCauseJsonDataInMemory = async function () {
    if (ruleBlockReferenceCauseJsonData === null) {
        ruleBlockReferenceCauseJsonData = await getCausesReferencesRuleConfig();
    }
};

exports.getRuleBlockReferenceCauseJsonData = function () {
    return ruleBlockReferenceCauseJsonData;
};

exports.syncRuleBlocksJsonData = async function () {
    ruleBlocksJsonData = null;
    ruleBlocksJsonData = await exports.getAllRuleBlocks();
};

exports.getAllRuleBlocks = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id, companyname as "companyName", description as "description", evaluationfactor as "evaluationFactor", evaluationmethod as "evaluationMethod",
     isactivated as "isActivated", name as "name", rules as "rules", userid as "userId", vesselid as "vesselId"  from ${RULE_BLOCKS};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All RuleBlocks Data from RuleBlocks Table");
        let ruleBlocksJson = {};
        for (let i =0 ; i< dbResponse.rows.length ; i++) {
            let records = dbResponse.rows[i];
            let key = records["id"];
            // delete records["id"];
            records["rules"] = JSON.parse(records["rules"]);
            ruleBlocksJson[key] = records;
        }
        return ruleBlocksJson;
    } else {
        console.error("Error Occurred While fetching data from RuleBlocks Table");
        return {};
    }
};

exports.createRuleBlock = async function (ruleBlocksData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${RULE_BLOCKS}
    (companyName, description, evaluationFactor, evaluationMethod, isActivated,name,rules,userId, vesselid)
     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;`;

    const values = [
        ruleBlocksData.companyName,
        ruleBlocksData.description,
        ruleBlocksData.evaluationFactor,
        ruleBlocksData.evaluationMethod,
        ruleBlocksData.isActivated,
        ruleBlocksData.name,
        ruleBlocksData.rules,
        ruleBlocksData.userId,
        ruleBlocksData.vesselId
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("RuleBlock Inserted In RuleBlocks Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting RuleBlock Record In RuleBlocks Table");
    }
};

exports.updateRuleBlockActivateStateById = async function (updatedRuleBlockData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const RuleBlockId = Object.keys(updatedRuleBlockData)[0];

    delete updatedRuleBlockData[RuleBlockId]["vesselName"];

    let queryBuilder = "";

    Object.entries(updatedRuleBlockData[RuleBlockId]).map((k, v) => {
        queryBuilder += k[0].toLowerCase() + " = '" + k[1] + "' , ";
    });

    queryBuilder = queryBuilder.substring(0, queryBuilder.length - 2);

    const updateQuery = `UPDATE "${RULE_BLOCKS}" SET ${queryBuilder} where id = ${RuleBlockId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating FailureAdvisory ById from FailureAdvisory Table");
        return false;
    }
};

exports.updateRuleBlockById = async function (updatedRuleBlockData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const id = Object.keys(updatedRuleBlockData)[0];

    const updateQuery = `UPDATE ${RULE_BLOCKS} SET companyname = $1, description = $2, evaluationfactor = $3, evaluationmethod = $4, isactivated = $5 ,name= $6, rules = $7,
     userid = $8, vesselid = $9 where id = $10;`;

    const values = [updatedRuleBlockData[id].companyName,
        updatedRuleBlockData[id].description,
        updatedRuleBlockData[id].evaluationFactor,
        updatedRuleBlockData[id].evaluationMethod,
        updatedRuleBlockData[id].isActivated,
        updatedRuleBlockData[id].name,
        updatedRuleBlockData[id].rules,
        updatedRuleBlockData[id].userId,
        updatedRuleBlockData[id].vesselId, parseInt(id)]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("Updated CauseById from Causes Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating CauseById from Causes Table");
        return false;
    }
};

exports.deleteRuleBlockById = async function (ruleBlockId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${RULE_BLOCKS} where id = ${ruleBlockId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting RuleBlocks Data By ID from RuleBlocks Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Deleting RuleBlock Data By ID from RuleBlocks Table");
        return false;
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${RULE_BLOCKS}
    (
        id serial
        constraint ${RULE_BLOCKS}_pk
            primary key,
        companyName varchar,
        description varchar,
        evaluationFactor jsonb,
        evaluationMethod jsonb,
        isActivated boolean,
        name varchar,
        rules varchar,
        userId integer
        constraint ${RULE_BLOCKS}_${USER}_id_fk
            references "${USER}",
        vesselId integer
        constraint ${RULE_BLOCKS}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("RuleBlocks Table Created")
            else
                console.error("Could Not Create RuleBlocks Table");
        })
};