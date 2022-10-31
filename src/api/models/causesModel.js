'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {CAUSES, CAUSES_REFERENCES_RULE_CONFIG, USER, SHIP}  = require("../utils/tables");

let causesJsonData = null;
let causesReferencesRuleConfigJsonData = null;

exports.loadCausesJsonDataInMemory = async function () {
    if (causesJsonData === null) {
        causesJsonData = await exports.getAllCauses();
    }
};

exports.getCausesJsonData = function () {
    return causesJsonData;
};

exports.syncCausesJsonData = async function () {
    causesJsonData = null;
    causesJsonData = await exports.getAllCauses();
};

exports.loadCausesReferencesRuleConfigJsonDataInMemory = async function () {
    if (causesReferencesRuleConfigJsonData === null) {
        causesReferencesRuleConfigJsonData = await exports.getCausesReferencesRuleConfig();
    }
};

exports.getCausesReferencesRuleConfigJsonData = function () {
    return causesReferencesRuleConfigJsonData;
};

exports.syncCausesReferencesRuleConfigJsonData = function () {
    causesReferencesRuleConfigJsonData = null;
    causesReferencesRuleConfigJsonData = exports.getCausesReferencesRuleConfig();
};

exports.getCauseDescriptionByKey = (causeId) => {
    return causesJsonData[causeId];
};

exports.getCausesDescriptionsByKey = (causesArray) => {
    let causesDescriptionArray = [];

    causesArray.forEach(function (causeKey) {
        causesDescriptionArray.push(causesJsonData[causeKey]);
    });

    return causesDescriptionArray;
};

exports.getCauseReferencesRuleConfigByKey = (causeId) => {
    return causesReferencesRuleConfigJsonData[causeId];
};

exports.getAllCauses = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id, name, companyname as "companyName", description, userid as "userId", vesselid as "vesselId" from ${CAUSES};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All Causes Data from Causes Table")
        let causesJsonObject = {};
        dbResponse.rows.map(item =>{
            causesJsonObject[item.id] = item;
        })
        return causesJsonObject;
    } else {
        console.error("Error Occurred While fetching All Causes Data from Causes Table");
        return {};
    }
};

exports.createCause = async function (causesData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${CAUSES}(name, companyname, description, userid, vesselid)
    VALUES($1, $2, $3, $4, $5) RETURNING id;`;

    const values = [causesData.name, causesData.companyName, causesData.description, causesData.userId, causesData.vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("Inserted Cause in Causes Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While inserting Cause in Causes Table");
        return false;
    }
};

exports.updateCauseById = async function (causeData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `UPDATE ${CAUSES} SET companyname = $1, description = $2, name= $3,
     userid = $4, vesselid = $5 where id = $6;`;

    const values = [causeData.companyName, causeData.description, causeData.name, causeData.userId, causeData.vesselId, causeData.id]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("Updated CauseById from Causes Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating CauseById from Causes Table");
        return false;
    }
};

exports.deleteCauseById = async function (causeId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${CAUSES} where id = ${causeId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting Cause Data By ID from Cause Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Deleting Ship Data By ID from Ship Table");
        return false;
    }
};

exports.deleteCausesReferencesRuleConfigById = async function (causeId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${CAUSES_REFERENCES_RULE_CONFIG} where causeid = ${causeId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting Cause Data By ID from Cause Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Deleting Ship Data By ID from Ship Table");
        return false;
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${CAUSES}
    (
        id serial
        constraint ${CAUSES}_pk
            primary key,
        companyName varchar,
        description varchar,
        name varchar,
        userId integer
        constraint ${CAUSES}_${USER}_id_fk
            references "${USER}",
        vesselId integer
        constraint ${CAUSES}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("Causes Table Created")
            else
                console.error("Could Not Create Causes Table");
        })
};

exports.insertData = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    await new Promise((resolve, reject) => {
        const causesData = {
            description: "Intermediate Shaft Bearing Temperature",
            name: "Intermediate Shaft Bearing Temperature"
        };
        reThinkDb.table("causes")
            .insert(causesData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
            });
    });
};

exports.getCausesReferencesRuleConfig = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id, causeid as "causeId", companyname as "companyName", userid as "userId", ref as "ref",vesselid as "vesselId"  from ${CAUSES_REFERENCES_RULE_CONFIG};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All CausesReferencesRuleConfig Data from CausesReferencesRuleConfig Table");
        let causesReferencesRuleConfigJson = {};
        for (let i =0 ; i< dbResponse.rows.length ; i++) {
            let records = dbResponse.rows[i];
            let causesId = records["causeId"];
            let causesReferencesRuleConfig = JSON.parse(records["ref"]);
            causesReferencesRuleConfig["companyName"] = records["companyName"];
            causesReferencesRuleConfig["userId"] = records["userId"];
            causesReferencesRuleConfig["vesselId"] = records["vesselId"];
            causesReferencesRuleConfigJson[causesId] = causesReferencesRuleConfig;
        }
        return causesReferencesRuleConfigJson;
    } else {
        console.error("Error Occurred While fetching data from CausesReferencesRuleConfig Table");
        return {};
    }
};

exports.updateCausesReferencesRuleConfigByCauseId = async function (causeId, updatedCauseReferencesRuleConfigData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `UPDATE ${CAUSES_REFERENCES_RULE_CONFIG} SET ref = $1 where causeid = $2;`;

    const values = [updatedCauseReferencesRuleConfigData.ref, causeId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("Updated CauseReferenceRuleConfig from CauseReferenceRuleConfig Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating CauseById from CauseReferenceRuleConfig Table");
        return false;
    }
};

exports.createCausesReferencesRuleConfig = async function (causesReferencesRuleConfigData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${CAUSES_REFERENCES_RULE_CONFIG}(causeId, companyname, ref, userid, vesselid)
    VALUES($1, $2, $3, $4, $5) RETURNING id;`;

    const values = [causesReferencesRuleConfigData.causeId,
        causesReferencesRuleConfigData.companyName,
        causesReferencesRuleConfigData.ref,
        causesReferencesRuleConfigData.userId,
        causesReferencesRuleConfigData.vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("Inserted Records in CausesReferencesCauses Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While inserting Records in CausesReferencesCauses Table");
        return false;
    }
};

exports.createCausesReferencesRuleConfigTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${CAUSES_REFERENCES_RULE_CONFIG}
    (
        id serial
        constraint ${CAUSES_REFERENCES_RULE_CONFIG}_pk
            primary key,
        causeId integer
        constraint ${CAUSES_REFERENCES_RULE_CONFIG}_${CAUSES}_id_fk
            references ${CAUSES},
        companyName varchar,
        ref varchar,
        userId integer
        constraint ${CAUSES_REFERENCES_RULE_CONFIG}_${USER}_id_fk
            references "${USER}",
        vesselId integer
        constraint ${CAUSES_REFERENCES_RULE_CONFIG}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("CausesReferencesRuleConfig Table Created")
            else
                console.error("Could Not Create CausesReferencesRuleConfig Table");
        })
};