'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {TRIGGERED_OUTCOMES_HISTORY, FAILURE_ADVISORIES, RULE_CONFIGS, SHIP}  = require("../utils/tables");

exports.saveHistoryOutcomes = async function (historyOutcomeData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${TRIGGERED_OUTCOMES_HISTORY}` +
        `(acknowledgestatus, advisorykey, comment, companyname, data, livevalue, livevalueunit, machinetype, observantmessage, ` +
        `observanttype, rulekey, timestamp, vesselid)` +
        `VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;
    const values = [historyOutcomeData.acknowledgeStatus, historyOutcomeData.advisorykey, historyOutcomeData.comment,
        historyOutcomeData.companyName, historyOutcomeData.data, historyOutcomeData.liveValue,
        historyOutcomeData.liveValueUnit, historyOutcomeData.machineType, historyOutcomeData.observantMessage,
        historyOutcomeData.observantType, historyOutcomeData.ruleKey, historyOutcomeData.timestamp, historyOutcomeData.vesselId];

    DataAccessAdaptor.executeQuery(query, values);
};

exports.deleteHistoryById = async function (historyId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `DELETE FROM ${TRIGGERED_OUTCOMES_HISTORY} WHERE id = $1`;
    const values = [historyId];

    return DataAccessAdaptor.executeQueryAsync(query, values);
};

exports.createTable = async function (){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${TRIGGERED_OUTCOMES_HISTORY}
    (
        id serial
        constraint ${TRIGGERED_OUTCOMES_HISTORY}_pk
            primary key,
        acknowledgeStatus boolean,
        advisoryKey integer
        constraint ${TRIGGERED_OUTCOMES_HISTORY}_${FAILURE_ADVISORIES}_id_fk
            references ${FAILURE_ADVISORIES},
        comment varchar,
        companyName varchar,
        data jsonb,
        liveValue numeric,
        liveValueUnit varchar,
        machineType varchar,
        observantMessage varchar,
        observantType varchar,
        ruleKey integer
        constraint ${TRIGGERED_OUTCOMES_HISTORY}_${RULE_CONFIGS}_id_fk
            references ${RULE_CONFIGS},
        timestamp timestamp,
        vesselId integer
        constraint ${TRIGGERED_OUTCOMES_HISTORY}_${SHIP}_id_fk
            references ${SHIP}
   );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("TriggeredOutcomesHistory Table Created Successfully!!!");
    } else {
        console.error("Error occurred while creating TriggeredOutcomesHistory Table!!!");
    }
};